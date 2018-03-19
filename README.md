# cove-partner

### Example of using GA plugin
```
let COVEPlayer = require('COVEPlayer');
COVEPlayer.addPlugin('analytics', require('./plugins/COVEGoogleAnalytics.js'));

let player = new COVEPlayer();
player.setPlayer(document.getElementById('video-player'));

player.analytics.setTrackingFunction(ga);
player.analytics.addMediaTracking(
  'Video Player',
  'Label for Video',
  'metric1',
  {
    start: 'MediaStart',
    stop: 'MediaStop'
  }
);

```