// var COVEMediaEvents = require('./COVEMediaEvents');
import COVEMediaEvents from './COVEMediaEvents';
import COVEGoogleAnalytics from './plugins/COVEGoogleAnalytics';

import extend from './libs/extend';

// Namespace for private variables and functions
var privateNS = {
  defaults: { // Namespace for default options
    plugins: {}
  }
};

/**
 * An interface for binding to and interacting with an embedded COVE player
 *
 * @param {object} [options] Passes to COVEMediaEvents. See constructor.
 * @constructor
 */
function COVEPlayer(options) {

  // Call the parent constructor
  COVEMediaEvents.call(this, this.options);

  // Add connected as an allowed event for the MessageAPI
  this._options.allowedEvents = this._options.allowedEvents.concat([
    'connected'
  ]);

  // Extend the options with any existing options
  this._options = extend({}, privateNS.defaults, (this._options || {}));
}

// Extend from the COVEMessagingAPI prototype
COVEPlayer.prototype = Object.create(COVEMediaEvents.prototype);

// Set the "constructor" property to refer to COVEPlayer
COVEPlayer.prototype.constructor = COVEPlayer;

/**
 * Sets up playback tracking and events. Loads plugins for the player. Calls
 * parent method.
 *
 * @param playerFrame
 */
COVEPlayer.prototype.setPlayer = function setPlayer(playerFrame) {

  // Add a handler to check for initialization
  this.on('message', this._initialize);

  // Add a handler to run on the initial play event
  this.on('play', this._onInitialPlay);

  // When a pause occurs, check to see if the end of video has been reached
  this.on('pause', this._handlePauseAtEndOfVideo);

  // Boot plugins
  this._loadPlugins();

  COVEMediaEvents.prototype.setPlayer.call(this, playerFrame);
};

/**
 * Resets and removes playback tracking and events. Calls parent method.
 *
 * @param playerFrame
 */
COVEPlayer.prototype.destroy = function destroy() {
  COVEMediaEvents.prototype.destroy.call(this);
  this.off('play', this._onInitialPlay);
  this.off('pause', this._handlePauseAtEndOfVideo);
  this._trackingFullVideoDuration = 0;
};

COVEPlayer.prototype._initialize = function _initialize() {

  // Unbind the initialization listener
  this.off('message', this._initialize);

  // Trigger an connected message to signify that the player has been
  // successfully connected to
  this.trigger('connected');
};

/**
 * Runs any setup code that relies on a playable video being present. Will
 * run once during the first play event of the video
 *
 * @private
 */
COVEPlayer.prototype._onInitialPlay = function _onInitialPlay() {

  // Unbind the initial play event immediately
  this.off('play', this._onInitialPlay);

  // Attempt to determine the full playback duration of the video, so that it
  // can later be used for handle end of video issues
  this._recordFullDurationOfVideo();
};

/**
 * Requests the full video duration from the API and stores the value for
 * later reference
 *
 * @private
 */
COVEPlayer.prototype._recordFullDurationOfVideo = function _recordFullDurationOfVideo() {

  // Request and store the full video duration
  this.getDuration().then(function(duration) {
    this._trackingFullVideoDuration = duration;
  }.bind(this));
};

/**
 * Special edge case handling for pause events that occur at the very end of
 * a video. This is required to handle cases where a video finishes playback
 * and instead of sending a complete event, sends a pause event
 *
 * @private
 */
COVEPlayer.prototype._handlePauseAtEndOfVideo = function _handlePauseAtEndOfVideo() {

  // When a pause occurs, fire off a request for the current playback position.
  this.getPosition().then(function(position) {

    // If the video has continued beyond or met its duration, trigger the on
    // complete event
    if (position > 0 &&
        this._trackingFullVideoDuration > 0 &&
        position >= this._trackingFullVideoDuration) {
      this.trigger('complete');
    }
  }.bind(this));
};

/**
 * Loads any plugins that are defined in the settings
 *
 * @private
 */
COVEPlayer.prototype._loadPlugins = function _loadPlugins() {

  // Loop through each of the installed plugins and boot each one
  Object.keys(this._options.plugins).forEach(
    function (pluginName) {

      // Run the plugin function for this COVEPlayer and boot the plugin
      this.plugin(pluginName, this._options.plugins[pluginName], [this]);
    }.bind(this)
  );
};

/**
 * Installs a plugin into the list of default plugins to load for future
 * instances of COVEPlayers
 *
 * @param {string} pluginName The name to load the plugin as. This is how the
 *                            plugin will be accessed
 * @param {function} plugin A function that returns the plugin. The function
 *                          will be called with the COVEPlayer instance as
 *                          the argument
 */
COVEPlayer.addPlugin = function addPlugin(pluginName, plugin) {
  privateNS.defaults.plugins[pluginName] = plugin;
};

// By default install the Google Analytics plugin
COVEPlayer.addPlugin('analytics', COVEGoogleAnalytics);

export default COVEPlayer;