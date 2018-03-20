# cove-partner

### Example of using dist version
```javascript
let player = new COVEPartner();
player.setPlayer(document.getElementById('video-player'));

player.analytics.setTrackingFunction(ga);
player.analytics.addMediaTracking(
  'Video Player', // Event Category
  'Label for Video', // Event Label
  'metric1',
  {
    start: 'MediaStart', // Event Action - Start
    stop: 'MediaStop' // Event Action - Stop
  }
);

```