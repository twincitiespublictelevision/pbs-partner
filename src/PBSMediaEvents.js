import PBSMessageAPI from './PBSMessageAPI';

/**
 * Triggers media events based on the messages sent from a PBS Player
 *
 * @param {object} [options] Passes to PBSMessageAPI. See constructor.
 * @constructor
 */
export default class PBSMediaEvents extends PBSMessageAPI {
  constructor(options = {}) {

    // Add MediaStart and MediaStop as allowed events to the MessageAPI
    options.allowedEvents = (options.allowedEvents || []).concat([
      'MediaStart',
      'MediaStop'
    ]);

    super(options);

    this._mediaEventHandlers = {
      'onInitialPlayEvent': this._onInitialPlayEvent.bind(this),
      'startRecordingPlaybackData': this._startRecordingPlaybackData.bind(this),
      'pauseRecordingPlaybackData': this._pauseRecordingPlaybackData.bind(this),
      'onVideoEnd': this._onVideoEnd.bind(this),
    };

    // // Do the initial reset and startup the tracking pieces
    // this._resetTracking();
  }

  /**
   * Resets the media event tracking. Calls parent method.
   *
   * @param playerFrame
   */
  setPlayer(playerFrame) {
    this._resetTracking();
    super.setPlayer(playerFrame);
  };

  /**
   * Resets the media event tracking. Calls parent method.
   */
  destroy() {
    super.destroy();
    this._resetTracking();
  };

  /**
   * Reset the internal tracking metrics back to their base values and unbind any
   * handlers that are currently listening for messages
   *
   * @private
   */
  _resetTracking() {

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
    this.off('play', this._mediaEventHandlers.onInitialPlayEvent);
    this.off('play', this._mediaEventHandlers.startRecordingPlaybackData);
    this.off('pause', this._mediaEventHandlers.pauseRecordingPlaybackData);
    this.off('adPlay', this._mediaEventHandlers.pauseRecordingPlaybackData);
    this.off('complete', this._mediaEventHandlers.onVideoEnd);
    this.off('destroy', this._mediaEventHandlers.onVideoEnd);

    // Bind the handler that performs set up on the initial play event
    this.on('play', this._mediaEventHandlers.onInitialPlayEvent);

    // Bind the handler that records playback duration
    this.on('play', this._mediaEventHandlers.startRecordingPlaybackData);

    // Bind the handler that pauses the recording of playback duration
    this.on('pause', this._mediaEventHandlers.pauseRecordingPlaybackData);
    this.on('adPlay', this._mediaEventHandlers.pauseRecordingPlaybackData);
  };

  /**
   * Once a message is received, remove the handler from the play event
   *
   * @private
   */
  _onInitialPlayEvent() {

    // Remove this handler from future play events
    this.off('play', this._mediaEventHandlers.onInitialPlayEvent);

    // Trigger a media start event to signify that this is the first new play
    this.trigger('MediaStart', {});

    // Bind the handler that tracks the final results of playback
    this.on('complete', this._mediaEventHandlers.onVideoEnd);
    this.on('destroy', this._mediaEventHandlers.onVideoEnd);
  };

  /**
   * Handle the end of video event. This should trigger a MediaStop event to any
   * listeners and reset the tracking state so that it is ready for another
   * playback
   *
   * @private
   */
  _onVideoEnd() {

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
  _startRecordingPlaybackData() {

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
  _pauseRecordingPlaybackData() {

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
  _recordPlaybackData() {

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
          this._furthestReach = pos|0;
        }
      }.bind(this)
    );
  };
}