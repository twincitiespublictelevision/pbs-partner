import Promise from 'native-promise-only';

import Plugin from './libs/plugin';
import EventHandler from './libs/Events';
import PBSTransport from './PBSTransport';

// Create a shorthand accessor for the query selector
let q = document.querySelector;

// Helper function for trying to match against iPads
function isiPad(userAgent) {
  return userAgent.match(/iPad/i) !== null;
}

// Helper function for trying to match against iPhones
function isiPhone(userAgent) {
  return userAgent.match(/iPhone/i) !== null;
}

let STATES = [
  'idle',
  'buffering',
  'playing',
  'paused'
];

// Namespace for default options
const defaults = {

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
   'position',
   'message' // Message is a generic event that triggers on every message
 ]
};

class PBSMessageAPI {
  constructor(options) {

    // Initialize options
    this._options = Object.assign({}, defaults, (options || {}));
    this._options.allowedEvents = this._options.allowedEvents.concat(defaults.allowedEvents);

    this._state = {
      playback: 'idle',
      muted: false
    };

    this._id = '';

    this._env = this._options.env || window

    this._transport = new PBSTransport(this._options.allowedEvents);

    this._transport.bind('initialize', () => this._state.playback = 'idle');
    this._transport.bind('play', () => this._state.playback = 'playing');
    this._transport.bind('pause', () => this._state.playback = 'paused');
    this._transport.bind('stop', () => this._state.playback = 'idle');
    this._transport.bind('complete', () => this._state.playback = 'idle');
  }

  setVideoId(id) {
    this._id = id;
  };
  
  getVideoId() {
    return this._id;
  };

  setPlayer(playerFrame) {

    // Do not destroy if the player is not set
    if (this._player && this._player.contentWindow) {
  
      // Make sure there are no existing bindings
      this.destroy();
    }

    // Create a reference to the UI container
    this._player = (typeof playerFrame === 'string') ? q(playerFrame) : playerFrame;
  
    // Do not boot if the player is not set
    if (this._player && this._player.contentWindow) {

      // Connect the transport between the client (window) and server (video player)
      this._transport.connect(this._env, this._player);
  
      // Create a bound page leave handler to ensure it is called with the
      // messaging API as the context
      this._pageLeaveHandler = this.destroy.bind(this);
  
      // Add an unload listener depending on the play
      if (isiPad(this._env.navigator.userAgent) || isiPhone(this._env.navigator.userAgent)) {
        this._env.addEventListener('pagehide', this._pageLeaveHandler);
      } else {
        this._env.addEventListener('beforeunload', this._pageLeaveHandler);
      }
  
      // Trigger a create event for anyone listening
      this._transport._triggerEvent('create');
    }
  };

  /**
   * Simple proxy method for binding events
   *
   * @param {String} event The name of the event to bind
   * @param {Function} handler The function to bind to the event
   * @returns {PBSMessageAPI}
   */
  on(event, handler) {
    if (this._options.allowedEvents.indexOf(event) !== -1) {
      this._transport.bind(event, handler);
    }

    return this;
  };

  /**
   * Simple proxy method for unbinding events
   *
   * @param {String} event The name of the event to unbind from
   * @param {Function} handler The function to unbind from the event
   * @returns {PBSMessageAPI}
   */
  off(event, handler) {
    this._transport.unbind(event, handler);

    return this;
  };

  /**
   * Simple proxy method for unbinding events
   *
   * @param {String} event The name of the event to unbind from
   * @param {Function} handler The function to unbind from the event
   * @returns {PBSMessageAPI}
   */
  trigger() {
    this._transport.trigger.apply(this._transport, Array.prototype.slice.call(arguments, 0));
    return this;
  };

  /**
   * Requests the player's current playback state.
   *
   * @returns {Promise.<string|null>}
   */
  getState() {
    return Promise.resolve(this._state.playback);
  };

  /**
   * Helper method to check if the player is in the play state
   *
   * @returns {Promise.<boolean>}
   */
  isPlaying() {
    return this.getState().then(function(state) {
      return state === 'playing';
    });
  }

  /**
   * Helper method to check if the player is at the end of a video
   * 
   * @returns {Promise.<boolean>}
   */
  isComplete() {
    return this._transport.getResponse('ended', false);
  }

  /**
   * Helper method to check if the player is currently seeking
   * 
   * @returns {Promise.<boolean>}
   */
  isSeeking() {
    return this._transport.getResponse('readyState', 0).then(function(readyState) {
      return readyState === 1;
    });
  }

  /**
   * Requests the current playback position in seconds.
   *
   * @returns {Promise.<int>}
   */
  getPosition() {
    return this._transport.getResponse('currentTime', 0);
  }

  /**
   * Requests the currently playing player's duration in seconds.
   *
   * @returns {Promise.<int>}
   */
  getDuration() {
    return this._transport.getResponse('duration', 0);
  }

  /**
   * Requests the player's current audio muting state.
   *
   * @returns {Promise.<boolean>}
   */
  getMute() {
    return this._transport.getResponse('muted', false);
  }

  /**
   * Requests the current playback volume percentage, as a number from 0 to 100.
   *
   * @returns {Promise.<int>}
   */
  getVolume() {
    return this._transport.getResponse('volume', 0).then(v => v * 100);
  }

  // No-Response methods

  /**
   * Requests that the player toggle the play state. If the player is in the
   * playing state, it should switch to the paused state. If the player is in
   * the paused state it should switch to the playing state. Resolves to null.
   *
   * @returns {Promise.<null>}
   */
  togglePlayState() {
    return this._transport.send('play');
  }

  /**
   * Requests that the player changes to the playing state. Resolves to null.
   *
   * @returns {Promise.<null>}
   */
  play() {
    return this.isPlaying().then(
      function playVideoIfNotPlaying(isPlaying) {

        // If the player is not currently playing, then ask it to play
        return !isPlaying ? this._transport.send('play') : null;
      }.bind(this)
    );
  }

  /**
   * Requests that the player changes to the paused state. Resolves to null.
   *
   * @returns {Promise.<null>}
   */
  pause() {
    return this.isPlaying().then(
      function pauseVideoIfNotPaused(isPlaying) {

        // If the player is currently playing, then ask it to pause
        return isPlaying ? this._transport.send('pause') : null;
      }.bind(this)
    );
  }

  /**
   * Stops the player (returning it to the idle state) and unloads the
   * currently playing media file.
   *
   * @returns {Promise.<null>}
   */
  stop() {
    return this._transport.send('pause').then(() => {
      return this._transport.send('load');
    });
  }

  /**
   * Jump to the specified position within the currently playing item. The
   * position is required and must be provided as an integer, in seconds.
   *
   * @param {Number} position The position to seek to
   * @returns {Promise.<null>}
   */
  seek(position) {
    return this._transport.send('setCurrentTime', position);
  }

  /**
   * Change the player's mute state (no sound). Toggles between muted and not
   * muted.
   *
   * @param {Boolean} muted 
   * @returns {Promise.<null>}
   */
  setMute() {
    this._state.muted = !this._state.muted;
    return this._transport.send('setMuted', this._state.muted);
  }

  /**
   * Sets the player's audio volume percentage, as a number between 0 and 100.
   *
   * @param {Number} volumePercentage The volume to set the player to
   * @returns {Promise.<null>}
   */
  setVolume(volumePercentage) {
    return this._transport.send('setVolume', volumePercentage / 100);
  }

  /**
   * Destroys the messaging channel for the PBSMessageAPI so that the event handler
   * that traps messages does not exist continually. Removes all bound events
   * from the underlying player element
   */
  destroy() {

    // Unbind and pending work in the transport
    this._transport.cleanup();

    // Remove the events bound to this instance
    this.off();

    if (isiPad(this._env.navigator.userAgent) || isiPhone(this._env.navigator.userAgent)) {
      this._env.removeEventListener('pagehide', this._pageLeaveHandler);
    } else {
      this._env.removeEventListener('beforeunload', this._pageLeaveHandler);
    }
  }
}

export default Plugin.mixin(PBSMessageAPI);