import { assert }    from 'chai';

import EventProxy    from '../../src/EventProxy';
import TyphonEvents  from '../../src/TyphonEvents';

/* eslint-disable no-undef */

describe('EventProxy', () =>
{
   let callbacks, eventbus, proxy;

   beforeEach(() =>
   {
      callbacks = {};
      eventbus = new TyphonEvents();
      proxy = new EventProxy(eventbus);
   });

   it('get name', () =>
   {
      eventbus.setEventbusName('testname');

      assert(proxy.getEventbusName() === 'testname');
   });

   it('trigger (on / off)', () =>
   {
      callbacks.testTriggerCount = 0;

      proxy.on('test:trigger', () => { callbacks.testTriggerCount++; });
      proxy.on('test:trigger2', () => { callbacks.testTriggerCount++; });

      proxy.trigger('test:trigger');
      eventbus.trigger('test:trigger2');

      assert(callbacks.testTriggerCount === 2);

      proxy.off();

      eventbus.trigger('test:trigger');
      eventbus.trigger('test:trigger2');

      assert(callbacks.testTriggerCount === 2);
   });

   it('trigger (destroy)', () =>
   {
      callbacks.testTriggerCount = 0;

      proxy.on('test:trigger', () => { callbacks.testTriggerCount++; });
      proxy.on('test:trigger2', () => { callbacks.testTriggerCount++; });

      proxy.trigger('test:trigger');
      eventbus.trigger('test:trigger2');

      assert(callbacks.testTriggerCount === 2);

      proxy.destroy();

      eventbus.trigger('test:trigger');
      eventbus.trigger('test:trigger2');

      assert(callbacks.testTriggerCount === 2);

      const testError = (err) =>
      {
         assert(err instanceof ReferenceError);
         assert(err.message === 'This EventProxy instance has been destroyed.');
      };

      // Ensure that proxy is destroyed and all methods throw a ReferenceError.
      try { proxy.destroy(); } catch (err) { testError(err); }
      try { proxy.getEventbusName(); } catch (err) { testError(err); }
      try { proxy.off(); } catch (err) { testError(err); }
      try { proxy.on('test:bogus', testError); } catch (err) { testError(err); }
      try { proxy.once('test:bogus', testError); } catch (err) { testError(err); }
      try { proxy.trigger('test:trigger'); } catch (err) { testError(err); }
      try { proxy.triggerAsync('test:trigger'); } catch (err) { testError(err); }
      try { proxy.triggerDefer('test:trigger'); } catch (err) { testError(err); }
      try { proxy.triggerSync('test:trigger'); } catch (err) { testError(err); }

      assert(callbacks.testTriggerCount === 2);
   });

   it('trigger (once)', () =>
   {
      callbacks.testTriggerCount = 0;

      proxy.once('test:trigger', () => { callbacks.testTriggerCount++; });
      proxy.once('test:trigger2', () => { callbacks.testTriggerCount++; });

      proxy.trigger('test:trigger');
      eventbus.trigger('test:trigger2');

      proxy.trigger('test:trigger');
      eventbus.trigger('test:trigger2');

      assert(callbacks.testTriggerCount === 2);
   });

   it('triggerDefer', (done) =>
   {
      callbacks.testTriggerCount = 0;

      proxy.on('test:trigger', () => { callbacks.testTriggerCount++; });
      proxy.on('test:trigger2', () => { callbacks.testTriggerCount++; });

      proxy.triggerDefer('test:trigger');
      eventbus.triggerDefer('test:trigger2');

      setTimeout(() =>
      {
         assert(callbacks.testTriggerCount === 2);
         done();
      }, 0);
   });

   it('triggerDefer (once)', (done) =>
   {
      callbacks.testTriggerOnce = 0;

      proxy.once('test:trigger:once', () => { callbacks.testTriggerOnce++; });
      proxy.on('test:trigger:verify', () => { assert(callbacks.testTriggerOnce === 1); done(); });

      proxy.triggerDefer('test:trigger:once');
      proxy.triggerDefer('test:trigger:once');
      proxy.triggerDefer('test:trigger:verify');
   });

   it('triggerSync-0', () =>
   {
      const result = proxy.triggerSync('test:trigger:sync0');

      assert(!Array.isArray(result));
      assert(result === void 0);
   });

   it('triggerSync-1', () =>
   {
      proxy.on('test:trigger:sync1', () => { callbacks.testTriggerSync1 = true; return 'foo'; });

      const result = eventbus.triggerSync('test:trigger:sync1');

      assert(callbacks.testTriggerSync1);
      assert(!Array.isArray(result));
      assert(result === 'foo');
   });

   it('triggerSync-2', () =>
   {
      proxy.on('test:trigger:sync2', () => { callbacks.testTriggerSync2A = true; return 'foo'; });
      proxy.on('test:trigger:sync2', () => { callbacks.testTriggerSync2B = true; return 'bar'; });

      const results = eventbus.triggerSync('test:trigger:sync2');

      assert(callbacks.testTriggerSync2A);
      assert(callbacks.testTriggerSync2B);
      assert(Array.isArray(results));
      assert(results.length === 2);
      assert(results[0] === 'foo' && results[1] === 'bar');
   });

   it('triggerSync (on / off)', () =>
   {
      proxy.on('test:trigger:sync:off', () => { callbacks.testTriggerSyncOff = true; return true; });
      proxy.off('test:trigger:sync:off');
      assert(eventbus.triggerSync('test:trigger:sync:off') === void 0);
      assert(callbacks.testTriggerSyncOff === void 0);
   });

   it('triggerSync-1 (once)', () =>
   {
      callbacks.testTriggerOnce = 0;

      proxy.once('test:trigger:once', () => { callbacks.testTriggerOnce++; return 'foo'; });

      let result = eventbus.triggerSync('test:trigger:once');

      assert(callbacks.testTriggerOnce === 1);
      assert(!Array.isArray(result));
      assert(result === 'foo');

      result = eventbus.triggerSync('test:trigger:once');

      assert(callbacks.testTriggerOnce === 1);
      assert(result === void 0);
   });

   it('triggerSync (Promise)', (done) =>
   {
      proxy.on('test:trigger:sync:then', () =>
      {
         callbacks.testTriggerSyncThen = true;
         return Promise.resolve('foobar');
      });

      const promise = eventbus.triggerSync('test:trigger:sync:then');

      assert(promise instanceof Promise);

      promise.then((result) =>
      {
         assert(callbacks.testTriggerSyncThen);
         assert(result === 'foobar');
         done();
      });
   });

   it('triggerAsync', (done) =>
   {
      proxy.on('test:trigger:async', () => { callbacks.testTriggerAsync = true; return 'foo'; });
      proxy.on('test:trigger:async', () => { callbacks.testTriggerAsync2 = true; return 'bar'; });

      const promise = eventbus.triggerAsync('test:trigger:async');

      assert(promise instanceof Promise);

      // triggerAsync resolves all Promises by Promise.all() so result is an array.
      promise.then((result) =>
      {
         assert(callbacks.testTriggerAsync);
         assert(callbacks.testTriggerAsync2);
         assert(result[0] === 'foo');
         assert(result[1] === 'bar');
         done();
      });
   });

   it('triggerAsync (once)', (done) =>
   {
      callbacks.testTriggerOnce = 0;

      proxy.once('test:trigger:once', () => { callbacks.testTriggerOnce++; return 'foo'; });

      const promise = eventbus.triggerAsync('test:trigger:once');

      assert(callbacks.testTriggerOnce === 1);
      assert(promise instanceof Promise);

      const promise2 = eventbus.triggerAsync('test:trigger:once');

      assert(callbacks.testTriggerOnce === 1);
      assert(promise2 instanceof Promise);

      promise2.then((result) =>
      {
         assert(result === void 0);

         // triggerAsync resolves all Promises by Promise.all() or Promise.resolve() so result is a string.
         promise.then((result) =>
         {
            assert(callbacks.testTriggerOnce === 1);
            assert(result === 'foo');
            done();
         });
      });
   });
});