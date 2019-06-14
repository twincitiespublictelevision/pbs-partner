import extend from './../libs/extend';

/**
 * Google Analytics tracking for MediaEvents
 *
 * @constructor
 */
let GoogleAnalytics = function(PBSMediaEvents) {

  this._PBSMediaEvents = PBSMediaEvents;

  // Set up default values for the internal state
  this._tracker = null;
  this._trackingTargets = {
    'MediaStart': [],
    'MediaStop': []
  };

  // Bind the events of the PBSMediaEvents so that they track to the defined
  // tracker
  this._PBSMediaEvents.on('MediaStart', this._trackMediaStart.bind(this));
  this._PBSMediaEvents.on('MediaStop', this._trackMediaStop.bind(this));
};

/**
 * Sets the tracking function that should be called with the data that
 * should be tracked. The function will be called with Google Analytics event
 * tracking syntax.
 *
 * @param {function} fn A function that supports the Google Analytics tracking
 *                      syntax
 */
GoogleAnalytics.prototype.setTrackingFunction = function setTrackingFunction(fn) {
  this._tracker = fn;
};

/**
 * Stores the category and label pair as an object in the array of pairs for the
 * passed in event. These are the pairs of category and label that should be
 * tracked to when the event occurs
 *
 * @param {string} event The event that should be assigned to
 * @param {string} category The category that should be tracked with
 * @param {string} label The label that should be tracked with
 * @param {string} metric The name of the metric to track to
 * @private
 */
GoogleAnalytics.prototype._addTracking = function _addTracking(event, category, label, metric, actionOverride) {
  this._trackingTargets[event].push({
    category: category,
    label: label,
    metric: metric,
    action: actionOverride
  });
};

/**
 * Stores the category and label pair as an object in the array of pairs for the
 * MediaStart event. These are the pairs of category and label that should be
 * tracked to when the event occurs
 *
 * @param {string} category The category that should be tracked with
 * @param {string} label The label that should be tracked with
 * @param {string} metric The name of the metric to track to
 */
GoogleAnalytics.prototype.addMediaStartTracking = function addMediaStartTracking(category, label, metric, actionOverride) {
  this._addTracking('MediaStart', category, label, metric, actionOverride);
};

/**
 * Stores the category and label pair as an object in the array of pairs for the
 * MediaStop event. These are the pairs of category and label that should be
 * tracked to when the event occurs
 *
 * @param {string} category The category that should be tracked with
 * @param {string} label The label that should be tracked with
 * @param {string} metric The name of the metric to track to
 */
GoogleAnalytics.prototype.addMediaStopTracking = function addMediaStopTracking(category, label, metric, actionOverride) {
  this._addTracking('MediaStop', category, label, metric, actionOverride);
};

/**
 * Stores the category and label pair as an object in the array of pairs for the
 * all Media events. These are the pairs of category and label that should be
 * tracked to when the event occurs
 *
 * @param {string} category The category that should be tracked with
 * @param {string} label The label that should be tracked with
 * @param {string} metric The name of the metric to track to
 * @param {object} [actionOverrides] Optionally specify custom start and stop tracking actions
 */
GoogleAnalytics.prototype.addMediaTracking = function addMediaStopTracking(category, label, metric, actionOverrides) {

  // Loop through the Media
  this.addMediaStartTracking(category, label, metric, actionOverrides && actionOverrides.start || undefined);
  this.addMediaStopTracking(category, label, metric, actionOverrides && actionOverrides.stop || undefined);
};


/**
 * Bind the tracking events to the Messaging API so that messages from PBS
 * trigger the appropriate tracking handlers
 *
 * @private
 */
GoogleAnalytics.prototype._trackMediaStart = function startTracking() {

  // If a tracker has been defined then track to it
  if (this._tracker) {

    // For each for the defined media start configs trigger call
    // the event tracking function
    this._trackingTargets.MediaStart.forEach(
      function performMediaStartTrack(trackingConfig) {

        // Perform the tracking call
        this._tracker(
          'send',
          'event',
          trackingConfig.category,
          trackingConfig.action || 'MediaStart',
          trackingConfig.label,
          {
            transport: 'beacon'
          }
        );
      },
      this
    );
  }
};

/**
 * Track the MediaStop action to the defined tracker.
 *
 * @param {object} event An object containing data sent with the event
 * @private
 */
GoogleAnalytics.prototype._trackMediaStop = function _trackMediaStop(event) {

  // Since this event is often called during a potentially troublesome time
  // (ie. unload of the page), attempt to use the beacon method if it is
  // available in the browser
  var options = {
    transport: 'beacon'
  };

  // Track the event to the tracker if it is available
  if (this._tracker) {

    // For each for the defined media stop configs trigger call
    // the event tracking function
    this._trackingTargets.MediaStop.forEach(
      function performMediaStopTrack(trackingConfig) {

        // Generate a custom metric out of the furthest reach data
        var gaOptionsWithMetric = extend({}, options);
        gaOptionsWithMetric[trackingConfig.metric] = event && event.secondsReached || 0;

        // Along with the event send the cumulative number of playback seconds that
        // were recorded as the event value as well as the custom reach metric
        this._tracker(
          'send',
          'event',
          trackingConfig.category,
          trackingConfig.action || 'MediaStop',
          trackingConfig.label,
          event && event.secondsPlayed || 0,
          gaOptionsWithMetric
        );
      },
      this
    );
  }
};

export default GoogleAnalytics;