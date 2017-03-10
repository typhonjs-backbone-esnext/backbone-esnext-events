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
      proxy = eventbus.createEventProxy();
   });

   it('get name', () =>
   {
      eventbus.setEventbusName('testname');

      assert(proxy.getEventbusName() === 'testname');
   });

   it('forEachEvent', () =>
   {
      const callback1 = () => {};
      const callback2 = () => {};
      const callback3 = () => {};
      const callback3A = () => {};

      const context1 = {};
      const context2 = {};
      const context3 = {};
      const context3A = {};

      const allCallbacks = [callback1, callback2, callback3, callback3A];
      const allContexts = [context1, context2, context3, context3A];
      const allNames = ['test:trigger', 'test:trigger2', 'test:trigger3', 'test:trigger3'];

      // Proxy will not list this event on the main eventbus.
      eventbus.on('can:not:see:this', () => {});

      proxy.on('test:trigger', callback1, context1);
      proxy.on('test:trigger2', callback2, context2);
      proxy.on('test:trigger3', callback3, context3);
      proxy.on('test:trigger3', callback3A, context3A);

      let cntr = 0;

      proxy.forEachEvent((name, callback, context) =>
      {
         assert.strictEqual(name, allNames[cntr]);
         assert.strictEqual(callback, allCallbacks[cntr]);
         assert.strictEqual(context, allContexts[cntr]);
         cntr++;
      });
   });

   it('getEventNames', () =>
   {
      eventbus.on('can:not:see:this', () => {});

      proxy.on('test:trigger', () => {});
      proxy.on('test:trigger2', () => {});
      proxy.on('test:trigger3', () => {});
      proxy.on('test:trigger3', () => {});

      const eventNames = proxy.getEventNames();

      assert.strictEqual(JSON.stringify(eventNames), '["test:trigger","test:trigger2","test:trigger3"]');
   });

   it('trigger (on / off)', () =>
   {
      callbacks.testTriggerCount = 0;

      proxy.on('test:trigger', () => { callbacks.testTriggerCount++; });
      eventbus.on('test:trigger2', () => { callbacks.testTriggerCount++; });

      proxy.trigger('test:trigger');
      proxy.trigger('test:trigger2');
      eventbus.trigger('test:trigger2');

      assert.strictEqual(callbacks.testTriggerCount, 3);

      proxy.off();

      assert.strictEqual(proxy.eventCount, 0);

      eventbus.trigger('test:trigger');
      eventbus.trigger('test:trigger2');

      assert.strictEqual(callbacks.testTriggerCount, 4);
   });

   it('trigger (on / off - name)', () =>
   {
      callbacks.testTriggerCount = 0;

      eventbus.on('test:trigger', () => { callbacks.testTriggerCount++; });
      proxy.on('test:trigger', () => { callbacks.testTriggerCount++; });
      proxy.on('test:trigger2', () => { callbacks.testTriggerCount++; });

      eventbus.trigger('test:trigger');
      proxy.trigger('test:trigger');
      proxy.trigger('test:trigger2');

      assert.strictEqual(callbacks.testTriggerCount, 5);

      proxy.off('test:trigger');

      assert.strictEqual(proxy.eventCount, 1);

      proxy.trigger('test:trigger');
      eventbus.trigger('test:trigger');

      proxy.trigger('test:trigger2');

      proxy.off('test:trigger2');

      assert.strictEqual(proxy.eventCount, 0);

      proxy.trigger('test:trigger2');
      eventbus.trigger('test:trigger2');

      assert.strictEqual(callbacks.testTriggerCount, 6);
   });

   it('trigger (on / off - callback)', () =>
   {
      callbacks.testTriggerCount = 0;

      const callback1 = () => { callbacks.testTriggerCount++; };
      const callback2 = () => { callbacks.testTriggerCount++; };

      eventbus.on('test:trigger', callback1);
      proxy.on('test:trigger', callback1);
      proxy.on('test:trigger2', callback2);

      eventbus.trigger('test:trigger');
      proxy.trigger('test:trigger');
      proxy.trigger('test:trigger2');

      assert.strictEqual(callbacks.testTriggerCount, 5);

      proxy.off(void 0, callback1);

      assert.strictEqual(proxy.eventCount, 1);

      proxy.trigger('test:trigger');
      eventbus.trigger('test:trigger');

      proxy.trigger('test:trigger2');

      proxy.off(void 0, callback2);

      assert.strictEqual(proxy.eventCount, 0);

      proxy.trigger('test:trigger2');
      eventbus.trigger('test:trigger2');

      assert.strictEqual(callbacks.testTriggerCount, 6);
   });

   it('trigger (on / off - callback)', () =>
   {
      callbacks.testTriggerCount = 0;

      const context = {};

      eventbus.on('test:trigger', () => { callbacks.testTriggerCount++; }, context);
      proxy.on('test:trigger', () => { callbacks.testTriggerCount++; }, context);
      proxy.on('test:trigger2', () => { callbacks.testTriggerCount++; }, callbacks);

      eventbus.trigger('test:trigger');
      proxy.trigger('test:trigger');
      proxy.trigger('test:trigger2');

      assert.strictEqual(callbacks.testTriggerCount, 5);

      proxy.off(void 0, void 0, context);

      assert.strictEqual(proxy.eventCount, 1);

      proxy.trigger('test:trigger');
      eventbus.trigger('test:trigger');

      proxy.trigger('test:trigger2');

      proxy.off(void 0, void 0, callbacks);

      assert.strictEqual(proxy.eventCount, 0);

      proxy.trigger('test:trigger2');
      eventbus.trigger('test:trigger2');

      assert.strictEqual(callbacks.testTriggerCount, 6);
   });

   it('trigger (destroy)', () =>
   {
      callbacks.testTriggerCount = 0;

      proxy.on('test:trigger', () => { callbacks.testTriggerCount++; });
      proxy.on('test:trigger2', () => { callbacks.testTriggerCount++; });
      eventbus.on('test:trigger3', () => { callbacks.testTriggerCount++; });

      proxy.trigger('test:trigger');
      proxy.trigger('test:trigger2');
      proxy.trigger('test:trigger3');
      eventbus.trigger('test:trigger');
      eventbus.trigger('test:trigger2');
      eventbus.trigger('test:trigger3');

      assert.strictEqual(callbacks.testTriggerCount, 6);

      proxy.destroy();

      eventbus.trigger('test:trigger');
      eventbus.trigger('test:trigger2');
      eventbus.trigger('test:trigger3');

      assert.strictEqual(callbacks.testTriggerCount, 7);

      const testError = (err) =>
      {
         assert(err instanceof ReferenceError);
         assert(err.message === 'This EventProxy instance has been destroyed.');
      };

      // Ensure that proxy is destroyed and all methods throw a ReferenceError.
      try { proxy.destroy(); }
      catch (err) { testError(err); }

      try { proxy.getEventbusName(); }
      catch (err) { testError(err); }

      try { proxy.off(); }
      catch (err) { testError(err); }

      try { proxy.on('test:bogus', testError); }
      catch (err) { testError(err); }

      try { proxy.once('test:bogus', testError); }
      catch (err) { testError(err); }

      try { proxy.trigger('test:trigger'); }
      catch (err) { testError(err); }

      try { proxy.triggerAsync('test:trigger'); }
      catch (err) { testError(err); }

      try { proxy.triggerDefer('test:trigger'); }
      catch (err) { testError(err); }

      try { proxy.triggerSync('test:trigger'); }
      catch (err) { testError(err); }

      assert(callbacks.testTriggerCount, 7);
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