import PBSMediaEvents from './PBSMediaEvents';
import GoogleAnalytics from './plugins/GoogleAnalytics';

// Namespace for private variables and functions
const privateNS = {
  defaults: { // Namespace for default options
    plugins: {}
  }
};

/**
 * An interface for binding to and interacting with an embedded PBS player
 *
 * @param {object} [options] Passes to PBSMediaEvents. See constructor.
 * @constructor
 */
function PBSPlayer(options) {

  // Call the parent constructor
  PBSMediaEvents.call(this, options);

  // Add connected as an allowed event for the MessageAPI
  this._options.allowedEvents = this._options.allowedEvents.concat([
    'connected'
  ]);

  this._handlers = {
    initialize: this._initialize.bind(this),
    onInitialPlay: this._onInitialPlay.bind(this),
    handlePauseAtEndOfVideo: this._handlePauseAtEndOfVideo.bind(this),
  };
}

// Extend from the PBSMessagingAPI prototype
PBSPlayer.prototype = Object.create(PBSMediaEvents.prototype);

// Set the "constructor" property to refer to PBSPlayer
PBSPlayer.prototype.constructor = PBSPlayer;

/**
 * Sets up playback tracking and events. Loads plugins for the player. Calls
 * parent method.
 *
 * @param playerFrame
 */
PBSPlayer.prototype.setPlayer = function setPlayer(playerFrame) {

  // Add a handler to check for initialization
  this.on('message', this._handlers.initialize);

  // Add a handler to run on the initial play event
  this.on('play', this._handlers.onInitialPlay);

  // When a pause occurs, check to see if the end of video has been reached
  this.on('pause', this._handlers.handlePauseAtEndOfVideo);

  // Boot plugins
  this._loadPlugins();

  PBSMediaEvents.prototype.setPlayer.call(this, playerFrame);
};

/**
 * Resets and removes playback tracking and events. Calls parent method.
 */
PBSPlayer.prototype.destroy = function destroy() {
  PBSMediaEvents.prototype.destroy.call(this);
  this.off('play', this._handlers.onInitialPlay);
  this.off('pause', this._handlers.handlePauseAtEndOfVideo);
  this._trackingFullVideoDuration = 0;
};

PBSPlayer.prototype._initialize = function _initialize() {

  // Unbind the initialization listener
  this.off('message', this._handlers.initialize);

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
PBSPlayer.prototype._onInitialPlay = function _onInitialPlay() {

  // Unbind the initial play event immediately
  this.off('play', this._handlers.onInitialPlay);

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
PBSPlayer.prototype._recordFullDurationOfVideo = function _recordFullDurationOfVideo() {

  // Start by resetting the internal tracking duration
  this._trackingFullVideoDuration = 0;

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
PBSPlayer.prototype._handlePauseAtEndOfVideo = function _handlePauseAtEndOfVideo() {

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
PBSPlayer.prototype._loadPlugins = function _loadPlugins() {

  // Loop through each of the installed plugins and boot each one
  Object.keys(privateNS.defaults.plugins).forEach(
    function (pluginName) {

      // Run the plugin function for this PBSPlayer and boot the plugin
      this.plugin(pluginName, privateNS.defaults.plugins[pluginName], [this]);
    }.bind(this)
  );
};

/**
 * Installs a plugin into the list of default plugins to load for future
 * instances of PBSPlayers
 *
 * @param {string} pluginName The name to load the plugin as. This is how the
 *                            plugin will be accessed
 * @param {function} plugin A function that returns the plugin. The function
 *                          will be called with the PBSPlayer instance as
 *                          the argument
 */
PBSPlayer.addPlugin = function addPlugin(pluginName, plugin) {
  privateNS.defaults.plugins[pluginName] = plugin;
};

// By default install the Google Analytics plugin
PBSPlayer.addPlugin('analytics', GoogleAnalytics);

export default PBSPlayer;