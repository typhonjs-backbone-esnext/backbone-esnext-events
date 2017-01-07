import TyphonEvents from 'backbone-esnext-events';

export default class EventProxy
{
   constructor(eventbus)
   {
      if (!(eventbus instanceof TyphonEvents))
      {
         throw new TypeError(`'eventbus' is not an instance of TyphonEvents.`);
      }

      this._eventbus = eventbus;
      this._events = new TyphonEvents();
   }

   destroy()
   {
      this._events.stopListening(this._eventbus);
      this._eventbus = null;
      this._events = null;
   }

   getEventbusName()
   {
      if (this._eventbus === null) { throw new ReferenceError('This EventProxy instance has been destroyed.') }

      return this._eventbus.getEventbusName();
   }

   off(name, callback = void 0, context = void 0)
   {
      if (this._events === null || this._eventbus === null)
      {
         throw new ReferenceError('This EventProxy instance has been destroyed.')
      }

      this._events.stopListening(this._eventbus, name, callback, context);

      return this;
   }

   on(name, callback, context = void 0)
   {
      if (this._events === null || this._eventbus === null)
      {
         throw new ReferenceError('This EventProxy instance has been destroyed.')
      }

      this._events.listenTo(this._eventbus, name, callback, context);

      return this;
   }

   once(name, callback, context = void 0)
   {
      if (this._events === null || this._eventbus === null)
      {
         throw new ReferenceError('This EventProxy instance has been destroyed.')
      }

      this._events.listenToOnce(this._eventbus, name, callback, context);

      return this;
   }

   trigger()
   {
      if (this._eventbus === null) { throw new ReferenceError('This EventProxy instance has been destroyed.') }

      this._eventbus.trigger(...arguments);

      return this;
   }

   triggerAsync()
   {
      if (this._eventbus === null) { throw new ReferenceError('This EventProxy instance has been destroyed.') }

      return this._eventbus.triggerAsync(...arguments);
   }

   triggerDefer()
   {
      if (this._eventbus === null) { throw new ReferenceError('This EventProxy instance has been destroyed.') }

      this._eventbus.triggerDefer(...arguments);

      return this;
   }

   triggerSync()
   {
      if (this._eventbus === null) { throw new ReferenceError('This EventProxy instance has been destroyed.') }

      return this._eventbus.triggerSync(...arguments);
   }
}