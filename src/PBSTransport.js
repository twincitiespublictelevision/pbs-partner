import Promise from 'native-promise-only';

import EventHandler from './libs/Events';

// Helper function for getting the last n elements of a list
function lastElements(list, n) {
  return list.slice(Math.max(list.length - n, 0));
}

// These are commands defined by PBS or jwPlayer to not send return
// messages to the issuer of the message
const noResponse = [
  'play',
  'pause',
  'seek',
  'stop',
  'load',
  'setMuted',
  'setVolume',
  'setCurrentTime'
];

// Define a map of the PBS event namespace to the TPT event namespace
const playerEvents = {
  
  // jwplayer events
  'initialized': 'initialize',
  'video::playing': 'play',
  'video::idle': 'stop',
  'video::paused': 'pause',
  'video::finished': 'complete',
  'video::seeking': 'seek',
  'ad::started': 'adPlay',
  'ad::complete': 'adComplete',
  'getPosition': 'position',

  // // video.js events
  // 'playing': 'play',
  // 'paused': 'pause',
  // 'ended': 'stop',
  // 'loadeddata': 'initialize',
  // 'seeking': 'seek',
  'currentTime': 'position'
};

// The player origin can not be safely be determined programatically. It
// is hard set here so communication only happens with the PBS player
const playerOrigin = 'https://player.pbs.org';

export default class PBSTransport extends EventHandler {
  constructor(allowedEvents) {
    super();

    this._allowedEvents = allowedEvents;

    this._pending = [];

    // Create a message list to track message history
    this._messages = {
      incoming: [],
      outgoing: []
    };
  }

  /**
   * An event channel function that handles message events and checks to see if
   * they belong to the PBS Cove API. If they do, they are then triggered
   * directly on the bound PBSMessageAPI
   *
   * @param event
   * @private
   */
  _eventChannel(event) {

    // IE9 requires the data to be extracted here as it will fail when trying to
    // set the data property of the event in the try / catch below

    // Extract the event data
    var eventData = event.data;

    // If this message came from this player, handle it
    if (this._validateEvent(event)) {

      // Store the event in the list of incoming messages
      this._messages.incoming = lastElements(this._messages.incoming.concat([event]), 25);

      // Always trigger a generic message event whenever a message is received
      this._triggerEvent('message');

      // Hand of the valid event to the be parsed and potentially
      // triggered
      this._triggerEvent(eventData);
    }
  }

  /**
   * Validates an event as a PBS Cove API message. Checks the events origin to
   * make sure that is coming from the player origin. Checks that the source of
   * the event is the window object of the bound player.
   *
   * @param {Event} event The raw message event
   * @returns {boolean} True if this event is valid and belongs to the player
   * @private
   */
  _validateEvent(event) {

    // Make sure that the message came from this video player instance
    // and that the iframe has not been hijacked
    return playerOrigin === event.origin &&
      this._server.contentWindow === event.source;
  }

  /**
   * Takes a message from the PBS Cove API and triggers the corresponding
   * PBSMessageAPI event. If the message is an unknown message, the message
   * event will be ignored.
   *
   * @param {String} eventData The message from PBS
   * @private
   */
  _triggerEvent(eventData) {

    let pEv = Object.keys(playerEvents).filter(ev => eventData.indexOf(ev) !== -1);

    // If this is an event that is mapped, trigger it
    if (pEv.length > 0 || this._allowedEvents.indexOf(eventData) !== -1) {

      let ev = eventData;
      let value = null;

      if (pEv.length > 0) {
        let parts = eventData.split('::');
        ev = playerEvents[pEv[0]];
        value = parts.length === 2 ? parts[1] : undefined;
      }

      this.trigger(ev, value);
    }
  }

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
  _testMessageType(messageObj, message) {

    // Extract the raw message
    var data = messageObj.data;

    // Split the message in to its parts
    var msgParts = data.split('::');

    // Return if the message is of the passed in type
    return msgParts.length > 0 && msgParts[0] === message;
  }

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
  _getMessageValue(messageObj) {

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
  }

  /**
   * Gets the value of the response sent by PBS to a request sent to the PBS
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
  _getResponseValue(message, defaultValue) {

    if (typeof defaultValue === 'undefined') {
      defaultValue = null;
    }

    return this.send(message).
      then(this._getMessageValue).
      catch(function(error) {
        return defaultValue;
      });
  }

  connect(client, server) {
    this._client = client;
    this._server = server;

    // Create an continually open channel to the messages coming from the
    // server (iframe player) to listen for events and bind it to this object
    // so that it can be called from the client context
    this._eventChannel = this._eventChannel.bind(this);
  
    // Open up a communication channel between the client and the server
    this._client.addEventListener('message', this._eventChannel);
  }

  getChannel() {
    return this._eventChannel.bind(this);
  }

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
  send(message, value) {

    // Check to make sure that we can access the communication channel
    if (!this._server || !this._server.contentWindow) {
      return Promise.reject(
        {
          status: false,
          message: 'PBSMessageAPI failed to connect to a player instance'
        }
      );
    }

    let sendPromise = new Promise(
      function (resolve, reject) {

        // Do not listen for a response for the message types that PBS will not
        // send a response for
        if (noResponse.indexOf(message) === -1) {

          // Define the event handler that will resolve the promise, pass along
          // the response, and finally detach from the window
          let messageHandler = function (event) {

            // Make sure that this is a valid event for this player and that
            // it is a response to the same message type that was requested
            if (this._validateEvent(event) &&
                this._testMessageType(event, message)) {

              // Unhook this handler from the window so it is not called again
              this._client.removeEventListener(
                'message',
                messageHandler
              );

              let index = this._pending.indexOf(messageHandler);

              if (index > -1) {
                this._pending.splice(index, 1);
              }

              // Successfully resolve the event and pass along the message event
              resolve(event);
            }
          }.bind(this);

          // Attach the event handler to listen for the response
          this._client.addEventListener(
            'message',
            messageHandler
          );

          this._pending.push(messageHandler);
        } else {

          // For the messages without a response, resolve the promise immediately
          resolve(null);
        }
      }.bind(this)
    );

    // Generate the message based on if the value is present
    var postMessage = typeof value !== 'undefined' ? message + '::' + value : message;

    // Store the event in the list of outgoing messages
    this._messages.outgoing = lastElements(
      this._messages.outgoing.concat([postMessage]),
      25
    );

    // Send the message off to the Cove video player
    this._server.contentWindow.postMessage(postMessage, playerOrigin);

    // Return the promise
    return sendPromise;
  }

  getResponse(message, defaultValue) {
    return this._getResponseValue(message, defaultValue);
  }

  cleanup() {

    // Trigger the destroy event
    this._triggerEvent('destroy');

    // Destroy the event channel
    this._client.removeEventListener('message', this._eventChannel);

    // Unbind any pending handlers that may have not been called
    this._pending.forEach(handler => {
      this._client.removeEventListener('message', handler);
    });

    this._pending = [];
  }
}