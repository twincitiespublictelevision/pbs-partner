import mixin from './mixin';

/**
 * @private
 * Copyright (c) 2011 Jerome Etienne, http://jetienne.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
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


export default {
	mixin: mixin(
		['bind', 'unbind', 'trigger'],
		MicroEvent
	)
}
