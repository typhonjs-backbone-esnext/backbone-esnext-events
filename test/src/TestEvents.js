import { assert }    from 'chai';
import TyphonEvents  from '../../src/TyphonEvents';

/* eslint-disable no-undef */

const s_CREATE_TIMED_FUNC = (func, timeout = 1000) =>
{
   return () =>
   {
      return new Promise((resolve, reject) =>
      {
         setTimeout(() => func(resolve, reject), timeout);
      });
   };
};

describe('Events', () =>
{
   let callbacks, eventbus;

   beforeEach(() => { callbacks = {}; eventbus = new TyphonEvents(); });

   it('set / get name', () =>
   {
      eventbus.setEventbusName('testname');
      assert.strictEqual(eventbus.getEventbusName(), 'testname');

      eventbus = new TyphonEvents('testname2');
      assert.strictEqual(eventbus.getEventbusName(), 'testname2');
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

      eventbus.on('test:trigger', callback1, context1);
      eventbus.on('test:trigger2', callback2, context2);
      eventbus.on('test:trigger3', callback3, context3);
      eventbus.on('test:trigger3', callback3A, context3A);

      let cntr = 0;

      eventbus.forEachEvent((name, callback, context) =>
      {
         assert.strictEqual(name, allNames[cntr]);
         assert.strictEqual(callback, allCallbacks[cntr]);
         assert.strictEqual(context, allContexts[cntr]);
         cntr++;
      });
   });

   it('getEventNames', () =>
   {
      eventbus.on('test:trigger', () => {});
      eventbus.on('test:trigger2', () => {});
      eventbus.on('test:trigger3', () => {});
      eventbus.on('test:trigger3', () => {});

      const eventNames = eventbus.getEventNames();

      assert.strictEqual(JSON.stringify(eventNames), '["test:trigger","test:trigger2","test:trigger3"]');
   });

   it('trigger', () =>
   {
      eventbus.on('test:trigger', () => { callbacks.testTrigger = true; });
      eventbus.trigger('test:trigger');

      assert.strictEqual(eventbus.eventCount, 1);

      assert.isTrue(callbacks.testTrigger);
   });

   it('object composition - trigger (on / off)', () =>
   {
      const anObject = {
         events: new TyphonEvents(),
         register: function() { this.events.on('test:trigger', this.handler, this); },
         testTrigger: 0,
         triggerTest: function() { this.events.trigger('test:trigger'); },
         handler: function() { this.testTrigger++; }
      };

      anObject.register();
      anObject.triggerTest();

      assert.strictEqual(anObject.events.eventCount, 1);

      assert.strictEqual(anObject.testTrigger, 1);

      anObject.events.off();

      assert.strictEqual(anObject.events.eventCount, 0);

      anObject.triggerTest();
      anObject.triggerTest();

      assert.strictEqual(anObject.testTrigger, 1);
   });

   it('trigger (on / off)', () =>
   {
      callbacks.testTrigger = 0;
      eventbus.on('test:trigger', () => { callbacks.testTrigger++; });
      eventbus.trigger('test:trigger');

      assert.strictEqual(eventbus.eventCount, 1);

      assert.strictEqual(callbacks.testTrigger, 1);

      eventbus.off();

      assert.strictEqual(eventbus.eventCount, 0);

      eventbus.trigger('test:trigger');
      eventbus.trigger('test:trigger');

      assert.strictEqual(callbacks.testTrigger, 1);
   });

   it('trigger (once)', () =>
   {
      callbacks.testTriggerOnce = 0;
      eventbus.once('test:trigger:once', () => { callbacks.testTriggerOnce++; });

      assert.strictEqual(eventbus.eventCount, 1);

      eventbus.trigger('test:trigger:once');

      assert.strictEqual(eventbus.eventCount, 0);

      eventbus.trigger('test:trigger:once');

      assert.strictEqual(eventbus.eventCount, 0);

      assert.strictEqual(callbacks.testTriggerOnce, 1);
   });

   it('trigger (listenTo)', () =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerCount = 0;

      test.listenTo(eventbus, 'test:trigger', () => { callbacks.testTriggerCount++; });

      eventbus.trigger('test:trigger');

      assert.strictEqual(eventbus.eventCount, 1);

      assert.strictEqual(callbacks.testTriggerCount, 1);

      // Test stop listening such that `test:trigger` is no longer registered.
      test.stopListening(eventbus, 'test:trigger');

      eventbus.trigger('test:trigger');

      assert.strictEqual(eventbus.eventCount, 0);

      assert.strictEqual(callbacks.testTriggerCount, 1);
   });

   it('trigger (listenToOnce)', () =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerOnce = 0;

      test.listenToOnce(eventbus, 'test:trigger', () => { callbacks.testTriggerOnce++; });

      assert.strictEqual(eventbus.eventCount, 1);

      eventbus.trigger('test:trigger');

      assert.strictEqual(eventbus.eventCount, 0);

      assert.strictEqual(callbacks.testTriggerOnce, 1);

      eventbus.trigger('test:trigger');

      assert.strictEqual(eventbus.eventCount, 0);

      assert.strictEqual(callbacks.testTriggerOnce, 1);
   });

   it('triggerDefer', (done) =>
   {
      eventbus.on('test:trigger:defer', () =>
      {
         assert.strictEqual(eventbus.eventCount, 1);

         done();
      });

      assert.strictEqual(eventbus.eventCount, 1);

      eventbus.triggerDefer('test:trigger:defer');
   });

   it('triggerDefer (once)', (done) =>
   {
      callbacks.testTriggerOnce = 0;

      eventbus.once('test:trigger:once', () => { callbacks.testTriggerOnce++; });

      assert.strictEqual(eventbus.eventCount, 1);

      eventbus.on('test:trigger:verify', () =>
      {
         assert.strictEqual(callbacks.testTriggerOnce, 1);

         assert.strictEqual(eventbus.eventCount, 1);

         done();
      });

      assert.strictEqual(eventbus.eventCount, 2);

      eventbus.triggerDefer('test:trigger:once');

      assert.strictEqual(eventbus.eventCount, 2); // Trigger is deferred so 2 events still exist.

      eventbus.triggerDefer('test:trigger:once');

      assert.strictEqual(eventbus.eventCount, 2); // Trigger is deferred so 2 events still exist.

      eventbus.triggerDefer('test:trigger:verify');
   });

   it('triggerDefer (listenTo)', (done) =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerCount = 0;

      test.listenTo(eventbus, 'test:trigger', () => { callbacks.testTriggerCount++; });

      assert.strictEqual(eventbus.eventCount, 1);

      eventbus.on('test:trigger:verify', () =>
      {
         assert.strictEqual(callbacks.testTriggerCount, 1);

         // Test stop listening such that `test:trigger` is no longer registered.
         test.stopListening(eventbus, 'test:trigger');

         assert.strictEqual(eventbus.eventCount, 2);
      });

      assert.strictEqual(eventbus.eventCount, 2);

      eventbus.on('test:trigger:verify:done', () =>
      {
         assert.strictEqual(callbacks.testTriggerCount, 1);

         assert.strictEqual(eventbus.eventCount, 2);

         done();
      });

      assert.strictEqual(eventbus.eventCount, 3);

      eventbus.triggerDefer('test:trigger');

      eventbus.triggerDefer('test:trigger:verify');

      eventbus.triggerDefer('test:trigger');

      eventbus.triggerDefer('test:trigger:verify:done');

      assert.strictEqual(eventbus.eventCount, 3);
   });

   it('triggerDefer (listenToOnce)', (done) =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerOnce = 0;

      test.listenToOnce(eventbus, 'test:trigger', () =>
      {
         callbacks.testTriggerOnce++;

         assert.strictEqual(eventbus.eventCount, 1);
      });

      assert.strictEqual(eventbus.eventCount, 1);

      eventbus.on('test:trigger:verify', () =>
      {
         assert.strictEqual(callbacks.testTriggerOnce, 1);

         assert.strictEqual(eventbus.eventCount, 1);

         done();
      });

      assert.strictEqual(eventbus.eventCount, 2);

      eventbus.triggerDefer('test:trigger');
      eventbus.triggerDefer('test:trigger');
      eventbus.triggerDefer('test:trigger:verify');

      assert.strictEqual(eventbus.eventCount, 2);
   });

   it('triggerSync-0', () =>
   {
      const result = eventbus.triggerSync('test:trigger:sync0');

      assert.strictEqual(eventbus.eventCount, 0);

      assert.isNotArray(result);
      assert.isUndefined(result);
   });

   it('triggerSync-1', () =>
   {
      eventbus.on('test:trigger:sync1', () => { callbacks.testTriggerSync1 = true; return 'foo'; });

      assert.strictEqual(eventbus.eventCount, 1);

      const result = eventbus.triggerSync('test:trigger:sync1');

      assert.isTrue(callbacks.testTriggerSync1);
      assert.isNotArray(result);
      assert.strictEqual(result, 'foo');
   });

   it('triggerSync-2', () =>
   {
      eventbus.on('test:trigger:sync2', () => { callbacks.testTriggerSync2A = true; return 'foo'; });
      eventbus.on('test:trigger:sync2', () => { callbacks.testTriggerSync2B = true; return 'bar'; });

      assert.strictEqual(eventbus.eventCount, 2);

      const results = eventbus.triggerSync('test:trigger:sync2');

      assert.isTrue(callbacks.testTriggerSync2A);
      assert.isTrue(callbacks.testTriggerSync2B);
      assert.isArray(results);
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0], 'foo');
      assert.strictEqual(results[1], 'bar');
   });

   it('triggerSync (on / off)', () =>
   {
      assert.strictEqual(eventbus.eventCount, 0);

      eventbus.on('test:trigger:sync:off', () => { callbacks.testTriggerSyncOff = true; return true; });

      assert.strictEqual(eventbus.eventCount, 1);

      eventbus.off('test:trigger:sync:off');

      assert.strictEqual(eventbus.eventCount, 0);

      assert.isUndefined(eventbus.triggerSync('test:trigger:sync:off'));
      assert.isUndefined(callbacks.testTriggerSyncOff);
   });

   it('triggerSync-1 (once)', () =>
   {
      callbacks.testTriggerOnce = 0;

      eventbus.once('test:trigger:once', () => { callbacks.testTriggerOnce++; return 'foo'; });

      assert.strictEqual(eventbus.eventCount, 1);

      let result = eventbus.triggerSync('test:trigger:once');

      assert.strictEqual(eventbus.eventCount, 0);

      assert.strictEqual(callbacks.testTriggerOnce, 1);
      assert.isNotArray(result);
      assert.strictEqual(result, 'foo');

      result = eventbus.triggerSync('test:trigger:once');

      assert.strictEqual(callbacks.testTriggerOnce, 1);
      assert.isUndefined(result);
   });

   it('triggerSync-1 (listenTo)', () =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerCount = 0;

      test.listenTo(eventbus, 'test:trigger:sync', () => { callbacks.testTriggerCount++; return 'foo'; });

      assert.strictEqual(eventbus.eventCount, 1);

      let result = eventbus.triggerSync('test:trigger:sync');

      assert.strictEqual(callbacks.testTriggerCount, 1);
      assert.isNotArray(result);
      assert.strictEqual(result, 'foo');

      assert.strictEqual(eventbus.eventCount, 1);

      test.stopListening(eventbus, 'test:trigger:sync');

      assert.strictEqual(eventbus.eventCount, 0);

      result = eventbus.triggerSync('test:trigger:sync');

      assert.strictEqual(callbacks.testTriggerCount, 1);
      assert.isUndefined(result);
   });

   it('triggerSync-1 (listenToOnce)', () =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerOnce = 0;

      test.listenToOnce(eventbus, 'test:trigger:once', () => { callbacks.testTriggerOnce++; return 'foo'; });

      assert.strictEqual(eventbus.eventCount, 1);

      let result = eventbus.triggerSync('test:trigger:once');

      assert.strictEqual(eventbus.eventCount, 0);

      assert.strictEqual(callbacks.testTriggerOnce, 1);
      assert.isNotArray(result);
      assert.strictEqual(result, 'foo');

      result = eventbus.triggerSync('test:trigger:once');

      assert.strictEqual(callbacks.testTriggerOnce, 1);
      assert.isUndefined(result);
   });

   it('triggerSync (Promise)', (done) =>
   {
      eventbus.on('test:trigger:sync:then', () =>
      {
         callbacks.testTriggerSyncThen = true;

         return Promise.resolve('foobar');
      });

      assert.strictEqual(eventbus.eventCount, 1);

      const promise = eventbus.triggerSync('test:trigger:sync:then');

      assert(promise instanceof Promise);

      promise.then((result) =>
      {
         assert.isTrue(callbacks.testTriggerSyncThen);
         assert.strictEqual(result, 'foobar');
         done();
      });
   });

   it('promise - triggerAsync', (done) =>
   {
      eventbus.on('test:trigger:async',
       s_CREATE_TIMED_FUNC((resolve) => { callbacks.testTriggerAsync = true; resolve('foo'); }));

      eventbus.on('test:trigger:async',
       s_CREATE_TIMED_FUNC((resolve) => { callbacks.testTriggerAsync2 = true; resolve('bar'); }));

      assert.strictEqual(eventbus.eventCount, 2);

      const promise = eventbus.triggerAsync('test:trigger:async');

      assert(promise instanceof Promise);

      // triggerAsync resolves all Promises by Promise.all() so result is an array.
      promise.then((result) =>
      {
         assert.isTrue(callbacks.testTriggerAsync);
         assert.isTrue(callbacks.testTriggerAsync2);
         assert.strictEqual(result[0], 'foo');
         assert.strictEqual(result[1], 'bar');
         done();
      });
   });

   it('promise - triggerAsync (once)', (done) =>
   {
      callbacks.testTriggerOnce = 0;

      assert.strictEqual(eventbus.eventCount, 0);

      eventbus.once('test:trigger:once',
       s_CREATE_TIMED_FUNC((resolve) => { callbacks.testTriggerOnce++; resolve('foo'); }));

      assert.strictEqual(eventbus.eventCount, 1);

      const promise = eventbus.triggerAsync('test:trigger:once');

      assert.strictEqual(eventbus.eventCount, 0);

      assert(promise instanceof Promise);

      const promise2 = eventbus.triggerAsync('test:trigger:once');

      assert(promise2 instanceof Promise);

      // triggerAsync resolves all Promises by Promise.all() or Promise.resolve() so result is a string.
      promise.then((result) =>
      {
         assert.strictEqual(callbacks.testTriggerOnce, 1);
         assert.strictEqual(result, 'foo');
         done();
      });
   });

   it('promise - triggerAsync (listenTo)', (done) =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerCount = 0;

      test.listenTo(eventbus, 'test:trigger:async',
       s_CREATE_TIMED_FUNC((resolve) => { callbacks.testTriggerCount++; resolve('foo'); }));

      assert.strictEqual(eventbus.eventCount, 1);

      let promise = eventbus.triggerAsync('test:trigger:async');

      assert(promise instanceof Promise);

      promise.then((result) =>
      {
         assert.strictEqual(callbacks.testTriggerCount, 1);
         assert.strictEqual(result, 'foo');
      }).then(() =>
      {
         test.stopListening(eventbus, 'test:trigger:async');

         assert.strictEqual(eventbus.eventCount, 0);

         promise = eventbus.triggerAsync('test:trigger:async');
         assert(promise instanceof Promise);

         promise.then((result) =>
         {
            assert.isUndefined(result);
            assert.strictEqual(callbacks.testTriggerCount, 1);
            done();
         });
      });
   });


   it('promise - triggerAsync (listenToOnce)', (done) =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerOnce = 0;

      assert.strictEqual(eventbus.eventCount, 0);

      test.listenToOnce(eventbus, 'test:trigger:once',
       s_CREATE_TIMED_FUNC((resolve) => { callbacks.testTriggerOnce++; resolve('foo'); }));

      assert.strictEqual(eventbus.eventCount, 1);

      const promise = eventbus.triggerAsync('test:trigger:once');

      assert(promise instanceof Promise);
      assert.strictEqual(eventbus.eventCount, 0);

      const promise2 = eventbus.triggerAsync('test:trigger:once');

      assert(promise2 instanceof Promise);

      // triggerAsync resolves all Promises by Promise.all() or Promise.resolve() so result is a string.
      promise.then((result) =>
      {
         assert.strictEqual(callbacks.testTriggerOnce, 1);
         assert.strictEqual(result, 'foo');
         done();
      });
   });

   it('async / await - triggerAsync', async () =>
   {
      eventbus.on('test:trigger:async',
       s_CREATE_TIMED_FUNC((resolve) => { callbacks.testTriggerAsync = true; resolve('foo'); }));

      eventbus.on('test:trigger:async',
       s_CREATE_TIMED_FUNC((resolve) => { callbacks.testTriggerAsync2 = true; resolve('bar'); }));

      assert.strictEqual(eventbus.eventCount, 2);

      const result = await eventbus.triggerAsync('test:trigger:async');

      assert.isTrue(callbacks.testTriggerAsync);
      assert.isTrue(callbacks.testTriggerAsync2);
      assert.strictEqual(result[0], 'foo');
      assert.strictEqual(result[1], 'bar');
   });

   it('async / await - triggerAsync (once)', async () =>
   {
      callbacks.testTriggerOnce = 0;

      assert.strictEqual(eventbus.eventCount, 0);

      eventbus.once('test:trigger:once',
       s_CREATE_TIMED_FUNC((resolve) => { callbacks.testTriggerOnce++; resolve('foo'); }));

      assert.strictEqual(eventbus.eventCount, 1);

      const result = await eventbus.triggerAsync('test:trigger:once');

      assert.strictEqual(eventbus.eventCount, 0);

      assert.strictEqual(callbacks.testTriggerOnce, 1);

      const result2 = await eventbus.triggerAsync('test:trigger:once');

      assert.strictEqual(callbacks.testTriggerOnce, 1);

      assert.isUndefined(result2);

      assert.strictEqual(callbacks.testTriggerOnce, 1);
      assert.strictEqual(result, 'foo');
   });

   it('async / await - triggerAsync (listenTo)', async () =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerCount = 0;

      test.listenTo(eventbus, 'test:trigger:async',
       s_CREATE_TIMED_FUNC((resolve) => { callbacks.testTriggerCount++; resolve('foo'); }));

      assert.strictEqual(eventbus.eventCount, 1);

      let result = await eventbus.triggerAsync('test:trigger:async');

      assert.strictEqual(callbacks.testTriggerCount, 1);
      assert.strictEqual(result, 'foo');

      test.stopListening(eventbus, 'test:trigger:async');

      assert.strictEqual(eventbus.eventCount, 0);

      result = await eventbus.triggerAsync('test:trigger:async');

      assert.isUndefined(result);
      assert.strictEqual(callbacks.testTriggerCount, 1);
   });


   it('async / await - triggerAsync (listenToOnce)', async () =>
   {
      const test = new TyphonEvents();

      callbacks.testTriggerOnce = 0;

      assert.strictEqual(eventbus.eventCount, 0);

      // test.listenToOnce(eventbus, 'test:trigger:once', () => { callbacks.testTriggerOnce++; return 'foo'; });
      test.listenToOnce(eventbus, 'test:trigger:once',
       s_CREATE_TIMED_FUNC((resolve) => { callbacks.testTriggerOnce++; resolve('foo'); }));

      assert.strictEqual(eventbus.eventCount, 1);

      const result = await eventbus.triggerAsync('test:trigger:once');

      assert.strictEqual(eventbus.eventCount, 0);

      assert.strictEqual(callbacks.testTriggerOnce, 1);

      const result2 = await eventbus.triggerAsync('test:trigger:once');

      assert.strictEqual(callbacks.testTriggerOnce, 1);
      assert.isUndefined(result2);

      // triggerAsync resolves all Promises by Promise.all() or Promise.resolve() so result is a string.
      assert.strictEqual(callbacks.testTriggerOnce, 1);
      assert.strictEqual(result, 'foo');
   });

   it('async / await - triggerAsync - try / catch reject error', async () =>
   {
      eventbus.on('test:trigger:async',
       s_CREATE_TIMED_FUNC((resolve) => { callbacks.testTriggerAsync = true; resolve('foo'); }));

      eventbus.on('test:trigger:async',
       s_CREATE_TIMED_FUNC((resolve, reject) => { reject(new Error('An Error!')); }));

      assert.strictEqual(eventbus.eventCount, 2);

      try
      {
         await eventbus.triggerAsync('test:trigger:async');

         throw new Error('No error thrown: should not reach here!');
      }
      catch (err) { /* nop */ }
   });

   it('async / await - triggerAsync - try / catch sync error', async () =>
   {
      eventbus.on('test:trigger:async',
       s_CREATE_TIMED_FUNC((resolve) => { callbacks.testTriggerAsync = true; resolve('foo'); }));

      eventbus.on('test:trigger:async', () => { throw new Error('An Error!'); });

      assert.strictEqual(eventbus.eventCount, 2);

      try
      {
         await eventbus.triggerAsync('test:trigger:async');

         throw new Error('No error thrown: should not reach here!');
      }
      catch (err) { /* nop */ }
   });
});