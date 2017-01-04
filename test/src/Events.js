import { assert }    from 'chai';
import TyphonEvents  from '../../src/TyphonEvents';

import mainEventbus  from '../../src/mainEventbus';

/* eslint-disable no-undef */

describe('Events', () =>
{
   let callbacks, eventbus;

   beforeEach(() => { callbacks = {}; eventbus = new TyphonEvents(); });

   it('set / get name', () =>
   {
      eventbus.setEventbusName('testname');
      assert(eventbus.getEventbusName() === 'testname');

      eventbus = new TyphonEvents('testname2');
      assert(eventbus.getEventbusName() === 'testname2');
   });

   it('trigger (mainEventbus)', () =>
   {
      mainEventbus.on('test:trigger', () => { callbacks.testTrigger = true; });
      mainEventbus.trigger('test:trigger');
      assert(callbacks.testTrigger);
   });

   it('trigger', () =>
   {
      eventbus.on('test:trigger', () => { callbacks.testTrigger = true; });
      eventbus.trigger('test:trigger');
      assert(callbacks.testTrigger);
   });

   it('trigger (once)', () =>
   {
      callbacks.testTriggerOnce = 0;
      eventbus.once('test:trigger:once', () => { callbacks.testTriggerOnce++; });
      eventbus.trigger('test:trigger:once');
      eventbus.trigger('test:trigger:once');
      assert(callbacks.testTriggerOnce === 1);
   });

   it('trigger (listenTo)', () =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerCount = 0;

      test.listenTo(eventbus, 'test:trigger', () => { callbacks.testTriggerCount++; });

      eventbus.trigger('test:trigger');

      assert(callbacks.testTriggerCount === 1);

      // Test stop listening such that `test:trigger` is no longer registered.
      test.stopListening(eventbus, 'test:trigger');

      eventbus.trigger('test:trigger');

      assert(callbacks.testTriggerCount === 1);
   });

   it('trigger (listenToOnce)', () =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerOnce = 0;

      test.listenToOnce(eventbus, 'test:trigger', () => { callbacks.testTriggerOnce++; });

      eventbus.trigger('test:trigger');

      assert(callbacks.testTriggerOnce === 1);

      eventbus.trigger('test:trigger');

      assert(callbacks.testTriggerOnce === 1);
   });

   it('triggerDefer', (done) =>
   {
      eventbus.on('test:trigger:defer', () => { done(); });
      eventbus.triggerDefer('test:trigger:defer');
   });

   it('triggerDefer (once)', (done) =>
   {
      callbacks.testTriggerOnce = 0;
      eventbus.once('test:trigger:once', () => { callbacks.testTriggerOnce++; });
      eventbus.on('test:trigger:verify', () => { assert(callbacks.testTriggerOnce === 1); done(); });

      eventbus.triggerDefer('test:trigger:once');
      eventbus.triggerDefer('test:trigger:once');
      eventbus.triggerDefer('test:trigger:verify');
   });
   it('triggerDefer (listenTo)', (done) =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerCount = 0;

      test.listenTo(eventbus, 'test:trigger', () => { callbacks.testTriggerCount++; });

      eventbus.on('test:trigger:verify', () =>
      {
         assert(callbacks.testTriggerCount === 1);

         // Test stop listening such that `test:trigger` is no longer registered.
         test.stopListening(eventbus, 'test:trigger');
      });

      eventbus.on('test:trigger:verify:done', () => { assert(callbacks.testTriggerCount === 1); done(); });

      eventbus.triggerDefer('test:trigger');

      eventbus.triggerDefer('test:trigger:verify');

      eventbus.triggerDefer('test:trigger');

      eventbus.triggerDefer('test:trigger:verify:done');
   });

   it('triggerDefer (listenToOnce)', (done) =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerOnce = 0;

      test.listenToOnce(eventbus, 'test:trigger', () => { callbacks.testTriggerOnce++; });
      eventbus.on('test:trigger:verify', () => { assert(callbacks.testTriggerOnce === 1); done(); });

      eventbus.triggerDefer('test:trigger');
      eventbus.triggerDefer('test:trigger');
      eventbus.triggerDefer('test:trigger:verify');
   });

   it('triggerSync-0', () =>
   {
      const result = eventbus.triggerSync('test:trigger:sync0');

      assert(!Array.isArray(result));
      assert(result === void 0);
   });

   it('triggerSync-1', () =>
   {
      eventbus.on('test:trigger:sync1', () => { callbacks.testTriggerSync1 = true; return 'foo'; });

      const result = eventbus.triggerSync('test:trigger:sync1');

      assert(callbacks.testTriggerSync1);
      assert(!Array.isArray(result));
      assert(result === 'foo');
   });

   it('triggerSync-2', () =>
   {
      eventbus.on('test:trigger:sync2', () => { callbacks.testTriggerSync2A = true; return 'foo'; });
      eventbus.on('test:trigger:sync2', () => { callbacks.testTriggerSync2B = true; return 'bar'; });

      const results = eventbus.triggerSync('test:trigger:sync2');

      assert(callbacks.testTriggerSync2A);
      assert(callbacks.testTriggerSync2B);
      assert(Array.isArray(results));
      assert(results.length === 2);
      assert(results[0] === 'foo' && results[1] === 'bar');
   });

   it('triggerSync (on / off)', () =>
   {
      eventbus.on('test:trigger:sync:off', () => { callbacks.testTriggerSyncOff = true; return true; });
      eventbus.off('test:trigger:sync:off');
      assert(eventbus.triggerSync('test:trigger:sync:off') === undefined);
      assert(callbacks.testTriggerSyncOff === undefined);
   });

   it('triggerSync-1 (once)', () =>
   {
      callbacks.testTriggerOnce = 0;

      eventbus.once('test:trigger:once', () => { callbacks.testTriggerOnce++; return 'foo'; });

      let result = eventbus.triggerSync('test:trigger:once');

      assert(callbacks.testTriggerOnce === 1);
      assert(!Array.isArray(result));
      assert(result === 'foo');

      result = eventbus.triggerSync('test:trigger:once');

      assert(callbacks.testTriggerOnce === 1);
      assert(result === void 0);
   });

   it('triggerSync-1 (listenTo)', () =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerCount = 0;

      test.listenTo(eventbus, 'test:trigger:sync', () => { callbacks.testTriggerCount++; return 'foo'; });

      let result = eventbus.triggerSync('test:trigger:sync');

      assert(callbacks.testTriggerCount === 1);
      assert(!Array.isArray(result));
      assert(result === 'foo');

      test.stopListening(eventbus, 'test:trigger:sync');

      result = eventbus.triggerSync('test:trigger:sync');

      assert(callbacks.testTriggerCount === 1);
      assert(result === void 0);
   });

   it('triggerSync-1 (listenToOnce)', () =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerOnce = 0;

      test.listenToOnce(eventbus, 'test:trigger:once', () => { callbacks.testTriggerOnce++; return 'foo'; });

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
      eventbus.on('test:trigger:sync:then', () =>
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
      eventbus.on('test:trigger:async', () => { callbacks.testTriggerAsync = true; return 'foo'; });
      eventbus.on('test:trigger:async', () => { callbacks.testTriggerAsync2 = true; return 'bar'; });

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

      eventbus.once('test:trigger:once', () => { callbacks.testTriggerOnce++; return 'foo'; });

      const promise = eventbus.triggerAsync('test:trigger:once');

      assert(callbacks.testTriggerOnce === 1);
      assert(promise instanceof Promise);

      const promise2 = eventbus.triggerAsync('test:trigger:once');

      assert(callbacks.testTriggerOnce === 1);
      assert(promise2 instanceof Promise);

      // triggerAsync resolves all Promises by Promise.all() or Promise.resolve() so result is a string.
      promise.then((result) =>
      {
         assert(callbacks.testTriggerOnce === 1);
         assert(result === 'foo');
         done();
      });
   });

   it('triggerAsync (listenTo)', (done) =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerCount = 0;

      test.listenTo(eventbus, 'test:trigger:async', () => { callbacks.testTriggerCount++; return 'foo'; });

      let promise = eventbus.triggerAsync('test:trigger:async');

      assert(promise instanceof Promise);

      promise.then((result) =>
      {
         assert(callbacks.testTriggerCount === 1);
         assert(result === 'foo');
      });

      test.stopListening(eventbus, 'test:trigger:async');

      promise = eventbus.triggerAsync('test:trigger:async');

      promise.then((result) =>
      {
         assert(result === void 0);
         assert(callbacks.testTriggerCount === 1);
         done();
      });
   });


   it('triggerAsync (listenToOnce)', (done) =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerOnce = 0;

      test.listenToOnce(eventbus, 'test:trigger:once', () => { callbacks.testTriggerOnce++; return 'foo'; });

      const promise = eventbus.triggerAsync('test:trigger:once');

      assert(callbacks.testTriggerOnce === 1);
      assert(promise instanceof Promise);

      const promise2 = eventbus.triggerAsync('test:trigger:once');

      assert(callbacks.testTriggerOnce === 1);
      assert(promise2 instanceof Promise);

      // triggerAsync resolves all Promises by Promise.all() or Promise.resolve() so result is a string.
      promise.then((result) =>
      {
         assert(callbacks.testTriggerOnce === 1);
         assert(result === 'foo');
         done();
      });
   });
});