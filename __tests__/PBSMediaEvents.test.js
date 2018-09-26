import PBSPlayer from '../src/PBSPlayer';
import { origin, mockPlayerFactory, mockWindowFactory, mockMessageEventFactoryFactory } from "./setup";

describe('PBSMediaEvents', function() {
  let env,
    player,
    api,
    messageMock,
    makeEvent;

  beforeEach(function() {
    messageMock = jest.fn();
    player = mockPlayerFactory();
    player.contentWindow.postMessage = messageMock;

    env = mockWindowFactory();

    api = new PBSPlayer({player: player, env: env});
    api.setPlayer(player);

    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  it('should work', function() {
    return expect(true).toEqual(true);
  });
});