'use strict';

var extend = require('./libs/extend.js'),
    Promise = require('native-promise-only'),
    MicroEvent = require('./libs/MicroEvent.js'),
    Plugin = require('./libs/plugin.js');

var COVEMessageAPI = (function() {

  // Create a shorthand accessor for the query selector
  var q = document.querySelector;

  // Helper function for getting the last n elements of a list
  function lastElements(list, n) {
    return list.slice(Math.max(list.length - n, 0));
  }

  // Helper function for trying to match against iPads
  function isiPad(userAgent) {
    return userAgent.match(/iPad/i) != null;
  }

  // Helper function for trying to match against iPhones
  function isiPhone(userAgent) {
    return userAgent.match(/iPhone/i) != null;
  }

  // Namespace for private variables and functions
  var privateNS = {
    defaults: { // Namespace for default options

      // These are commands defined by PBS or jwPlayer to not send return
      // messages to the issuer of the message
      noResponse: [
        'play',
        'pause',
        'seek',
        'stop',
        'setMute',
        'setVolume',
        'setCurrentCaptions',
        'setCurrentQuality'
      ],

      // The player origin can not be safely be determined programatically. It
      // is hard set here so communicate only happens with the PBS player
      playerOrigin: 'http://player.pbs.org',

      // Define a map of the PBS event namespace to the TPT event namespace
      playerEvents: {
        'initialized': 'initialize',
        'video::playing': 'play',
        'video::idle': 'stop',
        'video::paused': 'pause',
        'video::finished': 'complete',
        'video::seeking': 'seek',
        'ad::started': 'adPlay',
        'ad::complete': 'adComplete'
      },

      // Define a whitelist of supported events
      allowedEvents: [
        'create',
        'destroy',
        'initialize',
        'play',
        'stop',
        'pause',
        'complete',
        'seek',
        'adPlay',
        'adComplete',
        'error',
        'message' // Message is a generic event that triggers on every message
      ]
    }
  };

  /**
   * An toolset for communicating with an embedded COVE Player. Handles the
   * connection setup and the communication channel. Provides helper methods for
   * sending messages and retrieving information from the player.
   *
   * Initializes a COVEMessageAPI. Requires a single option, player, that is either
   * an existing DOM element or a string selector for and existing DOM element.
   *
   * @param {object} [options] An options object for configuration
   * @param {string|DOMElement} [options.player] The player instance to connect to
   * @param {string} [options.playerOrigin] The origin of the player. If this is
   *                                        not passed in then the COVE https
   *                                        origin is used
   * @param {object} [options.env] An optional argument used to specify the env
   *                               to listen for postMessage events on. If
   *                               ommited then a global window object will be
   *                               looked for
   * @constructor
   */
  function COVEMessageAPI(options) {

    // Initialize options
    this._options = extend({}, privateNS.defaults, (options || {}));

    // Set the environment of the player
    this._env = this._options.env || window;

    // Create a reference to the UI container if it is available
    if (this._options.player) {
      this.setPlayer(this._options.player);
    }
  }

  /**
   * Sets the play DOM element that should be communicated with and sets up the
   * appropriate communication channels
   *
   * @param playerFrame
   */
  COVEMessageAPI.prototype.setPlayer = function setPlayer(playerFrame) {

    // Do not destroy if the player is not set
    if (this._player && this._player.contentWindow) {

      // Make sure there are no existing bindings
      COVEMessageAPI.prototype.destroy.call(this);
    }

    // Create a reference to the UI container
    if (typeof playerFrame === 'string') {
      this._player = q(playerFrame);
    } else {
      this._player = playerFrame;
    }

    // Do not boot if the player is not set
    if (this._player && this._player.contentWindow) {

      // Create a message list to track message history
      this.messages = {
        incoming: [],
        outgoing: []
      };

      // Create an continually open channel to the messages coming from the
      // iframe player to listen for events and bind it to this object so that
      // it can be called from the window context
      this._eventChannel = this._eventChannel.bind(this);

      // Create a bound page leave handler to ensure it is called with the
      // messaging API as the context
      this._pageLeaveHandler = COVEMessageAPI.prototype.destroy.bind(this);

      // Open up a communication channel between the window and this player
      this._env.addEventListener(
        'message',
        this._eventChannel
      );

      // Add an unload listener depending on the play
      if (isiPad(this._env.navigator.userAgent) || isiPhone(this._env.navigator.userAgent)) {
        this._env.addEventListener('pagehide', this._pageLeaveHandler);
      } else {
        this._env.addEventListener('beforeunload', this._pageLeaveHandler);
      }

      // Trigger a create event for anyone listening
      this._triggerEvent('create');
    }
  };

  /**
   * An event channel function that handles message events and checks to see if
   * they belong to the PBS Cove API. If they do, they are then triggered
   * directly on the bound COVEMessageAPI
   *
   * @param event
   * @private
   */
  COVEMessageAPI.prototype._eventChannel = function _eventChannel(event) {

    // IE9 requires the data to be extracted here as it will fail when trying to
    // set the data property of the event in the try / catch below

    // Extract the event data
    var eventData = event.data;

    // If this message came from this player, handle it
    if (this._validateEvent(event)) {

      // Store the event in the list of incoming messages
      this.messages.incoming = lastElements(
        this.messages.incoming.concat([event]),
        25
      );

      // Always trigger a generic message event whenever a message is received
      this._triggerEvent('message');

      // Hand of the valid event to the be parsed and potentially
      // triggered
      this._triggerEvent(eventData);
    }
  };

  /**
   * Validates an event as a PBS Cove API message. Checks the events origin to
   * make sure that is coming from the player origin. Checks that the source of
   * the event is the window object of the bound player.
   *
   * @param {Event} event The raw message event
   * @returns {boolean} True if this event is valid and belongs to the player
   * @private
   */
  COVEMessageAPI.prototype._validateEvent = function _validateEvent(event) {

    // Make sure that the message came from this video player instance
    // and that the iframe has not been hijacked
    return this._options.playerOrigin === event.origin &&
      this._player.contentWindow === event.source;
  };

  /**
   * Takes a message from the PBS Cove API and triggers the corresponding
   * COVEMessageAPI event. If the message is an unknown message, the message
   * event will be ignored.
   *
   * @param {String} eventData The message from PBS
   * @private
   */
  COVEMessageAPI.prototype._triggerEvent = function _triggerEvent(eventData) {

    // If this is an event that is mapped, trigger it
    if (typeof this._options.playerEvents[eventData] !== 'undefined' ||
        this._options.allowedEvents.indexOf(eventData) !== -1) {

      this.trigger(
        this._options.playerEvents[eventData] || eventData
      );
    }
  };

  /**
   * Binds a COVEMessageAPI event to the underlying player DOM element. When a
   * COVEMessageAPI event is triggered on the underlying element it will fire the
   * handler passed in here
   *
   * @param {String} event The name of the event to bind
   * @param {Function} handler The function to bind to the event
   * @private
   */
  COVEMessageAPI.prototype._bindEvent = function _bindEvent(event, handler) {

    // Make sure this is a supported event before binding
    if (this._options.allowedEvents.indexOf(event) !== -1) {
      this.bind(
        event,
        handler
      );
    }
  };

  /**
   * Removes a handler that may or may not be bound to the underlying player
   *
   * @param {String} event The name of the event to unbind from
   * @param {Function} handler The function to unbind from the event
   * @private
   */
  COVEMessageAPI.prototype._unbindEvent = function _unbindEvent(event, handler) {

    // Blindly remove the handler, if it does not exist, oh well
    this.unbind(
      event,
      handler
    );
  };

  /**
   * Sends a post message to the window of the underlying player element. Takes
   * a message and a value and combines them in to the format requested by the
   * PBS Cove API. Returns back a Promise that will resolve when the PBS Cove
   * API responds with the same message. For messages that PBS does not send
   * responses to, the Promise will resolve with null. Otherwise the Promise
   * will resolve with the raw message event from Cove.
   *
   * @param {String} message The message to pass to the PBS Cove API
   * @param {String} [value] The value to associate with the message
   * @returns {Promise.<T>} A Promise that will resolve with either the raw
   *                           event message from Cove or null if the method is
   *                           one that Cove does not send a response to
   * @private
   */
  COVEMessageAPI.prototype._send = function _send(message, value) {

    // Check to make sure that we can access the communication channel
    if (!this._player || !this._player.contentWindow) {
      return Promise.reject(
        {
          status: false,
          message: 'COVEMessageAPI failed to connect to a player instance'
        }
      );
    }

    var sendPromise = new Promise(
      function (resolve, reject) {

        // Do not listen for a response for the message types that PBS will not
        // send a response for
        if (this._options.noResponse.indexOf(message) === -1) {

          // Define the event handler that will resolve the promise, pass along
          // the response, and finally detach from the window
          var messageHandler = function (event) {

            // Make sure that this is a valid event for this player and that
            // it is a response to the same message type that was requested
            if (this._validateEvent(event) &&
                this._testMessageType(event, message)) {

              // Unhook this handler from the window so it is not called again
              this._env.removeEventListener(
                'message',
                messageHandler
              );

              // Successfully resolve the event and pass along the message event
              resolve(event);
            }
          }.bind(this);

          // Attach the event handler to listen for the response
          this._env.addEventListener(
            'message',
            messageHandler
          );
        } else {

          // For the messages without a response, resolve the promise immediately
          resolve(null);
        }
      }.bind(this)
    );

    // Generate the message based on if the value is present
    var postMessage = typeof value !== 'undefined' ? message + '::' + value : message;

    // Store the event in the list of outgoing messages
    this.messages.outgoing = lastElements(
      this.messages.outgoing.concat([postMessage]),
      25
    );

    // Send the message off to the Cove video player
    this._player.contentWindow.postMessage(
      postMessage,
      this._options.playerOrigin
    );

    // Return the promise
    return sendPromise;
  };

  /**
   * Simple proxy method for binding events
   *
   * @param {String} event The name of the event to bind
   * @param {Function} handler The function to bind to the event
   * @returns {COVEMessageAPI}
   */
  COVEMessageAPI.prototype.on = function on(event, handler) {
    this._bindEvent(event, handler);

    return this;
  };

  /**
   * Simple proxy method for unbinding events
   *
   * @param {String} event The name of the event to unbind from
   * @param {Function} handler The function to unbind from the event
   * @returns {COVEMessageAPI}
   */
  COVEMessageAPI.prototype.off = function off(event, handler) {
    this._unbindEvent(event, handler);

    return this;
  };

  /**
   * Tests a message object to see if it applicable to a specific message type
   *
   * @param {object} messageObj A message object from the message channel
   * @param {string} message The type of message to test for
   * @returns {boolean} Returns true if the message object matches the message
   *                    type, false otherwise
   *
   * @private
   */
  COVEMessageAPI.prototype._testMessageType = function _testMessageType(messageObj, message) {

    // Extract the raw message
    var data = messageObj.data;

    // Split the message in to its parts
    var msgParts = data.split('::');

    // Return if the message is of the passed in type
    return msgParts.length > 0 && msgParts[0] === message;
  };

  /**
   * Extracts the value from a message object if there is one to extract. Will
   * return null if no value exists, or a valid value can not be extracted.
   *
   * @param {object} messageObj A message object from the message channel
   * @returns {*} Returns the value in the message object or null or a value
   *              does not exist or cannot be extracted.
   *
   * @private
   */
  COVEMessageAPI.prototype._getMessageValue = function _getMessageValue(messageObj) {

    // Extract the raw message
    var data = messageObj.data;

    // Split the message in to its parts
    var msgParts = data.split('::');

    // Return if the message is of the passed in type
    if (msgParts.length === 2) {

      // Try to parse the value of the message in case a number or boolean was
      // returned from the API
      try {
        return JSON.parse(msgParts[1]);
      } catch (exception) {

        // Otherwise return the value as is without manipulation
        return msgParts[1];
      }
    }

    return null;
  };

  /**
   * Gets the value of the response sent by COVE to a request sent to the COVE
   * player API. If a default value is passed in then this will resolve to that
   * value in the case that a value can not be extract from the response. If
   * no default value is passed in then null will be the default value.
   *
   * @param {string} message The message request to send
   * @param {*} [defaultValue] The default value to resolve to if a value can
   *                           not be determined
   * @returns {Promise.<T>} A promise that will resolve to either the value of
   *                        the response, or a default value
   *
   * @private
   */
  COVEMessageAPI.prototype._getResponseValue = function _getResponseValue(message, defaultValue) {

    if (typeof defaultValue === 'undefined') {
      defaultValue = null;
    }

    return this._send(message).
      then(this._getMessageValue).
      catch(function(error) {
        return defaultValue;
      });
  };

  /**
   * These calls are proxied through the PBS Cove API to the jwPlayer API
   *
   * @see https://support.jwplayer.com/customer/portal/articles/1413089-javascript-api-reference
   */

  /**`
   * Requests the player's current playback state.
   *
   * @returns {Promise.<string|null>}
   */
  COVEMessageAPI.prototype.getState = function getState() {
    return this._getResponseValue('getState');
  };

  /**
   * Helper method to check if the player is in the play state
   *
   * @returns {Promise.<boolean>}
   */
  COVEMessageAPI.prototype.isPlaying = function isPlaying() {
    return this.getState().then(function(state) {
      return state === 'playing';
    });
  };

  /**
   * Requests the current playback position in seconds.
   *
   * @returns {Promise.<int>}
   */
  COVEMessageAPI.prototype.getPosition = function getPosition() {
    return this._getResponseValue('getPosition', 0);
  };

  /**
   * Requests the currently playing player's duration in seconds.
   *
   * @returns {Promise.<int>}
   */
  COVEMessageAPI.prototype.getDuration = function getDuration() {
    return this._getResponseValue('getDuration', 0);
  };

  /**
   * Requests the player's current audio muting state.
   *
   * @returns {Promise.<boolean>}
   */
  COVEMessageAPI.prototype.getMute = function getMute() {
    return this._getResponseValue('getMute', false);
  };

  /**
   * Requests the current playback volume percentage, as a number from 0 to 100.
   *
   * @returns {Promise.<int>}
   */
  COVEMessageAPI.prototype.getVolume = function getVolume() {
    return this._getResponseValue('getVolume', 0);
  };

  /**
   * Requests the index of the currently active captions track. Note the
   * captions are Off if the index is 0.
   *
   * @returns {Promise.<int>}
   */
  COVEMessageAPI.prototype.getCurrentCaptions = function getCurrentCaptions() {
    return this._getResponseValue('getCurrentCaptions', 0);
  };

  /**
   * Requests the index of the currently active quality level.
   *
   * @returns {Promise.<int>}
   */
  COVEMessageAPI.prototype.getCurrentQuality = function getCurrentQuality() {
    return this._getResponseValue('getCurrentQuality', 0);
  };

  // No-Response methods

  /**
   * Requests that the player toggle the play state. If the player is in the
   * playing state, it should switch to the paused state. If the player is in
   * the paused state it should switch to the playing state. Resolves to null.
   *
   * @returns {Promise.<null>}
   */
  COVEMessageAPI.prototype.togglePlayState = function togglePlayState() {
    return this._send('play');
  };

  /**
   * Requests that the player changes to the playing state. Resolves to null.
   *
   * @returns {Promise.<null>}
   */
  COVEMessageAPI.prototype.play = function play() {

    return this.isPlaying().then(
      function playVideoIfNotPlaying(isPlaying) {

        // If the player is not currently playing, then ask it to play
        return !isPlaying ? this._send('play') : null;
      }.bind(this)
    );
  };

  /**
   * Requests that the player changes to the paused state. Resolves to null.
   *
   * @returns {Promise.<null>}
   */
  COVEMessageAPI.prototype.pause = function pause() {

    return this.isPlaying().then(
      function pauseVideoIfNotPaused(isPlaying) {

        // If the player is currently playing, then ask it to pause
        return isPlaying ? this._send('pause') : null;
      }.bind(this)
    );
  };

  /**
   * Stops the player (returning it to the idle state) and unloads the
   * currently playing media file.
   *
   * @returns {Promise.<null>}
   */
  COVEMessageAPI.prototype.stop = function stop() {
    return this._send('stop');
  };

  /**
   * Jump to the specified position within the currently playing item. The
   * position is required and must be provided as an integer, in seconds.
   *
   * @param {Number} position The position to seek to
   * @returns {Promise.<null>}
   */
  COVEMessageAPI.prototype.seek = function seek(position) {
    return this._send('seek', position);
  };

  /**
   * Change the player's mute state (no sound). Toggles between muted and not
   * muted.
   *
   * @returns {Promise.<null>}
   */
  COVEMessageAPI.prototype.setMute = function setMute() {
    return this._send('setMute');
  };

  /**
   * Sets the player's audio volume percentage, as a number between 0 and 100.
   *
   * @param {Number} volumePercentage The volume to set the player to
   * @returns {Promise.<null>}
   */
  COVEMessageAPI.prototype.setVolume = function setVolume(volumePercentage) {
    return this._send('setVolume', volumePercentage);
  };

  /**
   * Change the visible captions track to the provided index. The index must be
   * within the caption list. Note an index of 0 always turns the captions off.
   *
   * @param {Number} index The index of from the caption list to set the
   *                       selected captions to
   * @returns {Promise.<null>}
   */
  COVEMessageAPI.prototype.setCurrentCaptions = function setCurrentCaptions(index) {
    return this._send('setCurrentCaptions', index);
  };

  /**
   * Change the quality level to the provided index. The index must be within
   * the list of quality levels.
   *
   * @param {Number} index The index of the quality level to set.
   * @returns {Promise.<null>}
   */
  COVEMessageAPI.prototype.setCurrentQuality = function setCurrentQuality(index) {
    return this._send('setCurrentQuality', index);
  };

  /**
   * Destroys the messaging channel for the COVEMessageAPI so that the event handler
   * that traps messages does not exist continually. Removes all bound events
   * from the underlying player element
   */
  COVEMessageAPI.prototype.destroy = function destroy() {

    // Trigger the destroy event
    this._triggerEvent('destroy');

    // Remove the events bound to this instance
    this.off();

    // Destroy the event channel
    this._env.removeEventListener('message', this._eventChannel);

    if (isiPad(this._env.navigator.userAgent) || isiPhone(this._env.navigator.userAgent)) {
      this._env.removeEventListener('pagehide', this._pageLeaveHandler);
    } else {
      this._env.removeEventListener('beforeunload', this._pageLeaveHandler);
    }
  };

  return COVEMessageAPI;
})();

module.exports = Plugin.mixin(MicroEvent.mixin(COVEMessageAPI));