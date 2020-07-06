export default class EventHandler {
  constructor() {
    this._events = {};
  }

  bind(event, fn) {
    this._events[event] = this._events[event] || [];
    this._events[event].push(fn);
  }

  unbind(event, fn) {
    if (typeof fn === 'undefined') {
      if (typeof event === 'undefined') {
        this._events = {};
      } else {
        this._events[event] = [];
      }
    } else {
      if (event in this._events !== false) {
        let index = this._events[event].indexOf(fn);

        if (index > -1) {
          this._events[event].splice(index, 1);
        }
      }
    }
  }

  trigger(event) {
    let fns = (this._events[event] || []).slice();
    
    while (fns.length) {
      let fn = fns.shift();

      if (fn) {
        fn.apply(this, Array.prototype.slice.call(arguments, 1));
      }
    }
  }
}