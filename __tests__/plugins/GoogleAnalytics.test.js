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

  it('should work', function() {
    return expect(true).toEqual(true);
  });
});