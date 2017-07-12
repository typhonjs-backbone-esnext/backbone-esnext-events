import Events     from './Events.js';
import EventProxy from './EventProxy.js';

/**
 * TyphonEvents adds new functionality for trigger events. The following are new trigger mechanisms:
 *
 * `triggerDefer` - Defers invoking `trigger`.
 *
 * `triggerSync` - Invokes all targets matched and passes back a single result or an array of results in an array to
 *  the callee.
 *
 * `triggerAsync` - Invokes all targets matched and adds any returned results through `Promise.all` which returns
 *  a single promise to the callee.
 *
 * Please refer to the Events documentation for all inherited functionality.
 */
export default class TyphonEvents extends Events
{
   /**
    * Provides a constructor which optionally takes the eventbus name.
    *
    * @param {string}   eventbusName - Optional eventbus name.
    */
   constructor(eventbusName = void 0)
   {
      super();

      this.setEventbusName(eventbusName);
   }

   /**
    * Creates an EventProxy wrapping this events instance. An EventProxy proxies events allowing all listeners added
    * to be easily removed from the wrapped Events instance.
    *
    * @returns {EventProxy}
    */
   createEventProxy()
   {
      return new EventProxy(this);
   }

   /**
    * Iterates over all stored events invoking a callback with the event data stored.
    *
    * @param {function} callback - Callback invoked for each proxied event stored.
    */
   forEachEvent(callback)
   {
      /* istanbul ignore if */
      if (!this._events) { return; }

      /* istanbul ignore if */
      if (typeof callback !== 'function') { throw new TypeError(`'callback' is not a 'function'.`); }

      for (const name in this._events)
      {
         for (const event of this._events[name])
         {
            callback(name, event.callback, event.ctx);
         }
      }
   }

   /**
    * Returns the current proxied event count.
    *
    * @returns {Number}
    */
   get eventCount()
   {
      let count = 0;

      for (const name in this._events) { count += this._events[name].length; }

      return count;
   }

   /**
    * Returns the current eventbusName.
    *
    * @returns {string|*}
    */
   getEventbusName()
   {
      return this._eventbusName;
   }

   /**
    * Returns the event names of registered event listeners.
    *
    * @returns {string[]}
    */
   getEventNames()
   {
      /* istanbul ignore if */
      if (!this._events) { return []; }

      return Object.keys(this._events);
   }

   /**
    * Sets the eventbus name.
    *
    * @param {string}   name - The name for this eventbus.
    *
    * @return {TyphonEvents}
    */
   setEventbusName(name)
   {
      /**
       * Stores the name of this eventbus.
       * @type {string}
       * @private
       */
      this._eventbusName = name;

      return this;
   }

   /**
    * Provides `trigger` functionality, but collects any returned Promises from invoked targets and returns a
    * single Promise generated by `Promise.resolve` for a single value or `Promise.all` for multiple results. This is
    * a very useful mechanism to invoke asynchronous operations over an eventbus.
    *
    * @param {string}   name  - Event name(s)
    * @returns {Promise}
    */
   async triggerAsync(name)
   {
      /* istanbul ignore if */
      if (!this._events) { Promise.all([]); }

      const length = Math.max(0, arguments.length - 1);
      const args = new Array(length);
      for (let i = 0; i < length; i++) { args[i] = arguments[i + 1]; }

      const promise = s_EVENTS_API(s_TRIGGER_API, s_TRIGGER_ASYNC_EVENTS, this._events, name, void 0, args);

      return promise !== void 0 ? promise : Promise.resolve();
   }

   /**
    * Defers invoking `trigger`. This is useful for triggering events in the next clock tick.
    *
    * @returns {TyphonEvents}
    */
   triggerDefer()
   {
      setTimeout(() => { super.trigger(...arguments); }, 0);

      return this;
   }

   /**
    * Provides `trigger` functionality, but collects any returned result or results from invoked targets as a single
    * value or in an array and passes it back to the callee in a synchronous manner.
    *
    * @param {string}   name  - Event name(s)
    * @returns {*|Array<*>}
    */
   triggerSync(name)
   {
      /* istanbul ignore if */
      if (!this._events) { return void 0; }

      const start = 1;
      const length = Math.max(0, arguments.length - 1);
      const args = new Array(length);
      for (let i = 0; i < length; i++) { args[i] = arguments[i + start]; }

      return s_EVENTS_API(s_TRIGGER_API, s_TRIGGER_SYNC_EVENTS, this._events, name, void 0, args);
   }
}

// Private / internal methods ---------------------------------------------------------------------------------------

/**
 * Regular expression used to split event strings.
 * @type {RegExp}
 */
const s_EVENT_SPLITTER = /\s+/;

/**
 * Iterates over the standard `event, callback` (as well as the fancy multiple space-separated events `"change blur",
 * callback` and jQuery-style event maps `{event: callback}`).
 *
 * @param {function} iteratee       - Trigger API
 * @param {function} iterateeTarget - Internal function which is dispatched to.
 * @param {Array<*>} events         - Array of stored event callback data.
 * @param {string}   name           - Event name(s)
 * @param {function} callback       - callback
 * @param {Object}   opts           - Optional parameters
 * @returns {*}
 */
const s_EVENTS_API = (iteratee, iterateeTarget, events, name, callback, opts) =>
{
   let i = 0, names;

   if (name && typeof name === 'object')
   {
      // Handle event maps.
      if (callback !== void 0 && 'context' in opts && opts.context === void 0) { opts.context = callback; }
      for (names = Object.keys(name); i < names.length; i++)
      {
         events = s_EVENTS_API(iteratee, iterateeTarget, events, names[i], name[names[i]], opts);
      }
   }
   else if (name && s_EVENT_SPLITTER.test(name))
   {
      // Handle space-separated event names by delegating them individually.
      for (names = name.split(s_EVENT_SPLITTER); i < names.length; i++)
      {
         events = iteratee(iterateeTarget, events, names[i], callback, opts);
      }
   }
   else
   {
      // Finally, standard events.
      events = iteratee(iterateeTarget, events, name, callback, opts);
   }

   return events;
};

/**
 * Handles triggering the appropriate event callbacks.
 *
 * @param {function} iterateeTarget - Internal function which is dispatched to.
 * @param {Array<*>} objEvents      - Array of stored event callback data.
 * @param {string}   name           - Event name(s)
 * @param {function} cb             - callback
 * @param {Array<*>} args           - Arguments supplied to a trigger method.
 * @returns {*}
 */
const s_TRIGGER_API = (iterateeTarget, objEvents, name, cb, args) =>
{
   let result;

   if (objEvents)
   {
      const events = objEvents[name];
      let allEvents = objEvents.all;
      if (events && allEvents) { allEvents = allEvents.slice(); }
      if (events) { result = iterateeTarget(events, args); }
      if (allEvents) { result = iterateeTarget(allEvents, [name].concat(args)); }
   }

   return result;
};

/**
 * A difficult-to-believe, but optimized internal dispatch function for triggering events. Tries to keep the usual
 * cases speedy (most internal Backbone events have 3 arguments). This dispatch method uses ES6 Promises and adds
 * any returned results to an array which is added to a Promise.all construction which passes back a Promise which
 * waits until all Promises complete. Any target invoked may return a Promise or any result. This is very useful to
 * use for any asynchronous operations.
 *
 * @param {Array<*>} events   -  Array of stored event callback data.
 * @param {Array<*>} args     -  Arguments supplied to `triggerAsync`.
 * @returns {Promise}
 */
const s_TRIGGER_ASYNC_EVENTS = async (events, args) =>
{
   let ev, i = -1;
   const a1 = args[0], a2 = args[1], a3 = args[2], l = events.length;

   let result;
   const results = [];

   try
   {
      switch (args.length)
      {
         case 0:
            while (++i < l)
            {
               result = (ev = events[i]).callback.call(ev.ctx);

               // If we received a valid result add it to the promises array.
               if (result !== null || typeof result !== 'undefined') { results.push(result); }
            }
            break;

         case 1:
            while (++i < l)
            {
               result = (ev = events[i]).callback.call(ev.ctx, a1);

               // If we received a valid result add it to the promises array.
               if (result !== null || typeof result !== 'undefined') { results.push(result); }
            }
            break;

         case 2:
            while (++i < l)
            {
               result = (ev = events[i]).callback.call(ev.ctx, a1, a2);

               // If we received a valid result add it to the promises array.
               if (result !== null || typeof result !== 'undefined') { results.push(result); }
            }
            break;

         case 3:
            while (++i < l)
            {
               result = (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);

               // If we received a valid result add it to the promises array.
               if (result !== null || typeof result !== 'undefined') { results.push(result); }
            }
            break;

         default:
            while (++i < l)
            {
               result = (ev = events[i]).callback.apply(ev.ctx, args);

               // If we received a valid result add it to the promises array.
               if (result !== null || typeof result !== 'undefined') { results.push(result); }
            }
            break;
      }
   }
   catch (error) // will catch synchronous event binding errors and reject again async errors.
   {
      return Promise.reject(error);
   }

   // If there are multiple results then use Promise.all otherwise Promise.resolve.
   return results.length > 1 ? Promise.all(results) : Promise.resolve(result);
};

/**
 * A difficult-to-believe, but optimized internal dispatch function for triggering events. Tries to keep the usual
 * cases speedy (most internal Backbone events have 3 arguments). This dispatch method synchronously passes back a
 * single value or an array with all results returned by any invoked targets.
 *
 * @param {Array<*>} events   -  Array of stored event callback data.
 * @param {Array<*>} args     -  Arguments supplied to `triggerSync`.
 * @returns {*|Array<*>}
 */
const s_TRIGGER_SYNC_EVENTS = (events, args) =>
{
   let ev, i = -1;
   const a1 = args[0], a2 = args[1], a3 = args[2], l = events.length;

   let result;
   const results = [];

   switch (args.length)
   {
      case 0:
         while (++i < l)
         {
            result = (ev = events[i]).callback.call(ev.ctx);

            // If we received a valid result return immediately.
            if (result !== null || typeof result !== 'undefined') { results.push(result); }
         }
         break;
      case 1:
         while (++i < l)
         {
            result = (ev = events[i]).callback.call(ev.ctx, a1);

            // If we received a valid result return immediately.
            if (result !== null || typeof result !== 'undefined') { results.push(result); }
         }
         break;
      case 2:
         while (++i < l)
         {
            result = (ev = events[i]).callback.call(ev.ctx, a1, a2);

            // If we received a valid result return immediately.
            if (result !== null || typeof result !== 'undefined') { results.push(result); }
         }
         break;
      case 3:
         while (++i < l)
         {
            result = (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);

            // If we received a valid result return immediately.
            if (result !== null || typeof result !== 'undefined') { results.push(result); }
         }
         break;
      default:
         while (++i < l)
         {
            result = (ev = events[i]).callback.apply(ev.ctx, args);

            // If we received a valid result return immediately.
            if (result !== null || typeof result !== 'undefined') { results.push(result); }
         }
         break;
   }

   // Return the results array if there are more than one or just a single result.
   return results.length > 1 ? results : result;
};