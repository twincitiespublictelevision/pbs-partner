import PBSPlayer from '../../src/PBSPlayer';
import GoogleAnalytics from "../../src/plugins/GoogleAnalytics";

import { origin, mockPlayerFactory, mockWindowFactory, mockMessageEventFactoryFactory } from "../setup";

describe('GoogleAnalytics', function() {
  let env,
    player,
    api,
    messageMock,
    makeEvent,
    videoId;

  beforeEach(function() {
    videoId = 'abc-123-def-456';

    messageMock = jest.fn();
    player = mockPlayerFactory();
    player.contentWindow.postMessage = messageMock;

    env = mockWindowFactory();

    PBSPlayer.addPlugin('analytics', GoogleAnalytics);
    api = new PBSPlayer({player: player, env: env});
    api.setVideoId(videoId);
    api.setPlayer(player);

    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  it('should track MediaStart', function() {
    let trackFn = jest.fn();

    api.analytics.setTrackingFunction(trackFn);
    api.analytics.addMediaStartTracking('cat', 'label', 'metric')
    api.trigger('MediaStart');
    api.trigger('MediaStop');

    return expect(trackFn.mock.calls.length).toBe(1);
  });

  it('should track MediaStop', function() {
    let trackFn = jest.fn();

    api.analytics.setTrackingFunction(trackFn);
    api.analytics.addMediaStopTracking('cat', 'label', 'metric')
    api.trigger('MediaStart');
    api.trigger('MediaStop');

    return expect(trackFn.mock.calls.length).toBe(1);
  });

  it('should track both MediaStart and MediaStop', function() {
    let trackFn = jest.fn();

    api.analytics.setTrackingFunction(trackFn);
    api.analytics.addMediaTracking('cat', 'label', 'metric')
    api.trigger('MediaStart');
    api.trigger('MediaStop');

    return expect(trackFn.mock.calls.length).toBe(2);
  });
});