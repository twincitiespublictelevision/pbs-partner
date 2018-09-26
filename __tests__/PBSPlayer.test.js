import PBSPlayer from '../src/PBSPlayer';
import { origin, mockPlayerFactory, mockWindowFactory, mockMessageEventFactoryFactory } from "./setup";

describe('Initialize', function() {
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

  it('should trigger connected on first communication', function() {
    let handlerMock = jest.fn();
    api.on('connected', handlerMock);
    api.trigger('message');

    return expect(handlerMock.mock.calls.length).toBe(1);
  });
});

describe('Completion', function() {
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

  it('should trigger complete when pause occurs at end of video', function() {
    let handlerMock = jest.fn();

    let result = new Promise((res) => {
      api.on('complete', () => {
        handlerMock();
        res();
      });
    });

    api.trigger('message');
    env.dispatchEvent(makeEvent('video::playing'));
    env.dispatchEvent(makeEvent('getDuration::5'));
    env.dispatchEvent(makeEvent('video::paused'));
    env.dispatchEvent(makeEvent('getPosition::5'));

    return result.then(() => {
      return expect(handlerMock.mock.calls.length).toBe(1);
    });
  });
});