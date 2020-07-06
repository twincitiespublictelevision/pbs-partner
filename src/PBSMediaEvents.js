import PBSMessageAPI from './PBSMessageLegacyAPI';

/**
 * Triggers media events based on the messages sent from a PBS Player
 *
 * @param {object} [options] Passes to PBSMessageAPI. See constructor.
 * @constructor
 */
function PBSMediaEvents(options) {

  // Call the parent constructor
  PBSMessageAPI.call(this, options);

  // Add MediaStart and MediaStop as allowed events to the MessageAPI
  this._options.allowedEvents = this._options.allowedEvents.concat([
    'MediaStart',
    'MediaStop'
  ]);

  // Do the initial reset and startup the tracking pieces
  this._resetTracking();
}

// Extend from the PBSMessagingAPI prototype
PBSMediaEvents.prototype = Object.create(PBSMessageAPI.prototype);

// Set the "constructor" property to refer to PBSPlayer
PBSMediaEvents.prototype.constructor = PBSMediaEvents;

/**
 * Resets the media event tracking. Calls parent method.
 *
 * @param playerFrame
 */
PBSMediaEvents.prototype.setPlayer = function setPlayer(playerFrame) {
  this._resetTracking();
  PBSMessageAPI.prototype.setPlayer.call(this, playerFrame);
};

/**
 * Resets the media event tracking. Calls parent method.
 */
PBSMediaEvents.prototype.destroy = function destroy() {
  PBSMessageAPI.prototype.destroy.call(this);
  this._resetTracking();
};

/**
 * Reset the internal tracking metrics back to their base values and unbind any
 * handlers that are currently listening for messages
 *
 * @private
 */
PBSMediaEvents.prototype._resetTracking = function _resetTracking() {

  // Make sure if an interval is currently tracking playback duration that it
  // is stopped
  clearInterval(this._playedAmountIntervalId);

  // Clear out the interval id tracker
  this._playedAmountIntervalId = null;

  // Reset the tracker for the playback duration interval
  this._lastRun = 0;

  // Reset the furthest reached playback location
  this._furthestReach = 0;

  // Reset the playback duration sum
  this._playedAmount = 0;

  // Make sure that all of the message handlers are unbound before setup
  this.off('play', this._onInitialPlayEvent);
  this.off('play', this._startRecordingPlaybackData);
  this.off('pause', this._pauseRecordingPlaybackData);
  this.off('adPlay', this._pauseRecordingPlaybackData);
  this.off('complete', this._onVideoEnd);
  this.off('destroy', this._onVideoEnd);

  // Bind the handler that performs set up on the initial play event
  this.on('play', this._onInitialPlayEvent);

  // Bind the handler that records playback duration
  this.on('play', this._startRecordingPlaybackData);

  // Bind the handler that pauses the recording of playback duration
  this.on('pause', this._pauseRecordingPlaybackData);
  this.on('adPlay', this._pauseRecordingPlaybackData);
};

/**
 * Once a message is received, remove the handler from the play event
 *
 * @private
 */
PBSMediaEvents.prototype._onInitialPlayEvent = function _onInitialPlayEvent() {

  // Remove this handler from future play events
  this.off('play', this._onInitialPlayEvent);

  // Trigger a media start event to signify that this is the first new play
  this.trigger('MediaStart', {});

  // Bind the handler that tracks the final results of playback
  this.on('complete', this._onVideoEnd);
  this.on('destroy', this._onVideoEnd);
};

/**
 * Handle the end of video event. This should trigger a MediaStop event to any
 * listeners and reset the tracking state so that it is ready for another
 * playback
 *
 * @private
 */
PBSMediaEvents.prototype._onVideoEnd = function _trackMediaStop() {

  // Trigger a media stop event that will carry with it the number of seconds
  // played back as well as the furthest reached number of seconds at any given
  // point in time
  this.trigger('MediaStop', {
    secondsPlayed: (this._playedAmount / 1000)|0,
    secondsReached: this._furthestReach
  });

  // Reset the internals
  this._resetTracking();
};

/**
 * Begins the recording of cumulative playback duration and furthest reach
 *
 * @private
 */
PBSMediaEvents.prototype._startRecordingPlaybackData = function _startRecordingPlaybackData() {

  // Make sure the existing interval is stopped before starting an interval
  clearInterval(this._playedAmountIntervalId);

  // Store the current time as the first run time
  this._lastRun = Date.now();

  // Schedule the callback to run roughly every second
  this._playedAmountIntervalId = setInterval(
    this._recordPlaybackData.bind(this),
    1000
  );
};

/**
 * Pause the recording of cumulative playback duration and furthest reach
 *
 * @private
 */
PBSMediaEvents.prototype._pauseRecordingPlaybackData = function _pauseRecordingPlaybackData() {

  // If there is currently an interval running, stop it
  clearInterval(this._playedAmountIntervalId);
};

/**
 * Gets the number of milliseconds that have passed since the last time
 * a duration check has run and adds it to the cumulative playback duration.
 * Fires a message to the PBS Message API to request the current playback
 * position to determine the furthest point reached in the video
 *
 * @private
 */
PBSMediaEvents.prototype._recordPlaybackData = function _recordPlaybackData() {

  // Get the current time and compute the delta from the last run time
  var date = Date.now(),
      delta = date - this._lastRun;

  // Update the last run date to now
  this._lastRun = date;

  // Add the delta into the played amount
  this._playedAmount += delta;

  // During each interval, asynchronously ask for the current position of the
  // video and potentially store if as the farthest reach
  this.getPosition().then(
    function updateFurthestReach(pos) {

      // If the position of the player is further than the furthest reach point,
      // then record it
      if (this._furthestReach < pos) {
        this._furthestReach = pos;
      }
    }.bind(this)
  );
};

export default PBSMediaEvents;