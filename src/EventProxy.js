import TyphonEvents from './TyphonEvents.js';

/**
 * EventProxy provides a protected proxy of another TyphonEvents / eventbus instance.
 *
 * The main use case of EventProxy is to allow indirect access to an eventbus. This is handy when it comes to managing
 * the event lifecycle for a plugin system. When a plugin is added it could receive a callback, perhaps named
 * `onPluginLoaded`, which contains an EventProxy instance rather than the direct eventbus. This EventProxy instance is
 * associated in the management system controlling plugin lifecycle. When a plugin is removed / unloaded the management
 * system can automatically unregister all events for the plugin without requiring the plugin author doing it correctly
 * if they had full control. IE This allows to plugin system to guarantee no dangling listeners.
 *
 * EventProxy provides the on / off, once, and trigger methods with the same signatures as found in
 * TyphonEvents / Events. However, the proxy has an internal Events instance which is used to proxy between the target
 * eventbus which is passed in from the constructor. All registration methods (on / off / once) proxy through the
 * internal Events instance using 'listenTo', 'listenToOnce', and 'stopListening'. In addition there is a `destroy`
 * method which will unregister all of proxies events and remove references to the managed eventbus. Any further usage
 * of a destroyed EventProxy instance results in a ReferenceError thrown.
 */
export default class EventProxy
{
   /**
    * Creates the event proxy with an existing instance of TyphonEvents.
    *
    * @param {TyphonEvents}   eventbus - The target eventbus instance.
    */
   constructor(eventbus)
   {
      if (!(eventbus instanceof TyphonEvents))
      {
         throw new TypeError(`'eventbus' is not an instance of TyphonEvents.`);
      }

      /**
       * Stores the target eventbus.
       * @type {TyphonEvents}
       * @private
       */
      this._eventbus = eventbus;

      /**
       * Stores the proxy instance which manages all event binding with the target eventbus.
       * @type {TyphonEvents}
       * @private
       */
      this._proxy = new TyphonEvents();
   }

   /**
    * Unregisters all proxied events from the target eventbus and removes any local references. All subsequent calls
    * after `destroy` has been called result in a ReferenceError thrown.
    */
   destroy()
   {
      if (this._proxy === null || this._eventbus === null)
      {
         throw new ReferenceError('This EventProxy instance has been destroyed.');
      }

      this._proxy.stopListening(this._eventbus);
      this._eventbus = null;
      this._proxy = null;
   }

   /**
    * Returns the target eventbus name.
    *
    * @returns {string|*}
    */
   getEventbusName()
   {
      if (this._eventbus === null) { throw new ReferenceError('This EventProxy instance has been destroyed.'); }

      return this._eventbus.getEventbusName();
   }

   /**
    * Remove a previously-bound callback function from an object. This is proxied through `stopListening` of an
    * internal Events instance instead of directly modifying the target eventbus.
    *
    * Please see {@link Events#off}.
    *
    * @param {string}   name     - Event name(s)
    * @param {function} callback - Event callback function
    * @param {object}   context  - Event context
    * @returns {EventProxy}
    */
   off(name, callback = void 0, context = void 0)
   {
      if (this._proxy === null || this._eventbus === null)
      {
         throw new ReferenceError('This EventProxy instance has been destroyed.');
      }

      this._proxy.stopListening(this._eventbus, name, callback, context);

      return this;
   }

   /**
    * Bind a callback function to an object. The callback will be invoked whenever the event is fired. If you have a
    * large number of different events on a page, the convention is to use colons to namespace them: "poll:start", or
    * "change:selection".
    *
    * This is proxied through `listenTo` of an internal Events instance instead of directly modifying the target
    * eventbus.
    *
    * Please see {@link Events#on}.
    *
    * @param {string}   name     - Event name(s)
    * @param {function} callback - Event callback function
    * @param {object}   context  - Event context
    * @returns {EventProxy}
    */
   on(name, callback, context = void 0)
   {
      if (this._proxy === null || this._eventbus === null)
      {
         throw new ReferenceError('This EventProxy instance has been destroyed.');
      }

      this._proxy.listenTo(this._eventbus, name, callback, context);

      return this;
   }

   /**
    * Just like `on`, but causes the bound callback to fire only once before being removed. Handy for saying "the next
    * time that X happens, do this". When multiple events are passed in using the space separated syntax, the event
    * will fire once for every event you passed in, not once for a combination of all events
    *
    * This is proxied through `listenToOnce` of an internal Events instance instead of directly modifying the target
    * eventbus.
    *
    * Please see {@link Events#once}.
    *
    * @param {string}   name     - Event name(s)
    * @param {function} callback - Event callback function
    * @param {object}   context  - Event context
    *
    * @returns {EventProxy}
    */
   once(name, callback, context = void 0)
   {
      if (this._proxy === null || this._eventbus === null)
      {
         throw new ReferenceError('This EventProxy instance has been destroyed.');
      }

      this._proxy.listenToOnce(this._eventbus, name, callback, context);

      return this;
   }

   /**
    * Trigger callbacks for the given event, or space-delimited list of events. Subsequent arguments to trigger will be
    * passed along to the event callbacks.
    *
    * Please see {@link Events#trigger}.
    *
    * @returns {EventProxy}
    */
   trigger()
   {
      if (this._eventbus === null) { throw new ReferenceError('This EventProxy instance has been destroyed.'); }

      this._eventbus.trigger(...arguments);

      return this;
   }

   /**
    * Provides `trigger` functionality, but collects any returned Promises from invoked targets and returns a
    * single Promise generated by `Promise.resolve` for a single value or `Promise.all` for multiple results. This is
    * a very useful mechanism to invoke asynchronous operations over an eventbus.
    *
    * Please see {@link TyphonEvents#triggerAsync}.
    *
    * @returns {Promise}
    */
   triggerAsync()
   {
      if (this._eventbus === null) { throw new ReferenceError('This EventProxy instance has been destroyed.'); }

      return this._eventbus.triggerAsync(...arguments);
   }

   /**
    * Defers invoking `trigger`. This is useful for triggering events in the next clock tick.
    *
    * Please see {@link TyphonEvents#triggerDefer}.
    *
    * @returns {EventProxy}
    */
   triggerDefer()
   {
      if (this._eventbus === null) { throw new ReferenceError('This EventProxy instance has been destroyed.'); }

      this._eventbus.triggerDefer(...arguments);

      return this;
   }

   /**
    * Provides `trigger` functionality, but collects any returned result or results from invoked targets as a single
    * value or in an array and passes it back to the callee in a synchronous manner.
    *
    * Please see {@link TyphonEvents#triggerSync}.
    *
    * @returns {*|Array.<*>}
    */
   triggerSync()
   {
      if (this._eventbus === null) { throw new ReferenceError('This EventProxy instance has been destroyed.'); }

      return this._eventbus.triggerSync(...arguments);
   }
}