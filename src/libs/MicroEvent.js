var mixin = require('./mixin.js');

/**
 * Copyright (c) 2011 Jerome Etienne, http://jetienne.com
 *
 * MicroEvent - to make any js object an event emitter (server or browser)
 *
 * - pure javascript - server compatible, browser compatible
 * - don't rely on the browser DOM
 * - super simple - you get it immediately, no mystery, no magic involved
 *
 * - create a MicroEventDebug with goodies to debug
 *   - make it safer to use
*/

var MicroEvent	= function(){};
MicroEvent.prototype	= {
	bind	: function(event, fct){
		this._events = this._events || {};
		this._events[event] = this._events[event]	|| [];
		this._events[event].push(fct);
	},
	unbind	: function(event, fct){
    if (typeof fct === 'undefined') {
			if (typeof event === 'undefined') {
      	this._events = {};
			} else {
      	this._events[event] = [];
			}
      return;
    }
		this._events = this._events || {};
		if( event in this._events === false  )	return;
    var index = this._events[event].indexOf(fct);
		if( index > -1 ) this._events[event].splice(index, 1);
	},
	trigger	: function(event /* , args... */){
		this._events = this._events || {};
    var callbacks = (this._events[event] || []).slice();
    while (callbacks.length) {
      callbacks.shift().apply(this, Array.prototype.slice.call(arguments, 1));
    }
	}
};

module.exports = {
  mixin: mixin(
    ['bind', 'unbind', 'trigger'],
    MicroEvent
  )
};
