import PBSPlayer from '../src/PBSPlayer';
import { origin, mockPlayerFactory, mockWindowFactory, mockMessageEventFactoryFactory } from "./setup";

describe('MediaStart', function() {
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

  it('should send MediaStart exactly once', function() {
    let handlerMock = jest.fn();
    api.on('MediaStart', handlerMock);

    api.trigger('play');
    api.trigger('play');

    return expect(handlerMock.mock.calls.length).toBe(1);
  });

  it('should send MediaStart again after complete', function() {
    let handlerMock = jest.fn();
    api.on('MediaStart', handlerMock);

    api.trigger('play');
    api.trigger('complete');
    api.trigger('play');

    return expect(handlerMock.mock.calls.length).toBe(2);
  });

  it('should send MediaStart again after destroy', function() {
    let handlerMock = jest.fn();
    api.on('MediaStart', handlerMock);

    api.trigger('play');
    api.trigger('destroy');
    api.trigger('play');

    return expect(handlerMock.mock.calls.length).toBe(2);
  });
});

describe('MediaStop', function() {
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

  it('should send not send MediaStop before MediaStart', function() {
    let handlerMock = jest.fn();
    api.on('MediaStop', handlerMock);

    api.trigger('complete');

    return expect(handlerMock.mock.calls.length).toBe(0);
  });

  it('should send MediaStop on complete', function() {
    let handlerMock = jest.fn();
    api.on('MediaStop', handlerMock);

    api.trigger('play');
    api.trigger('complete');

    return expect(handlerMock.mock.calls.length).toBe(1);
  });

  it('should send MediaStop on destroy', function() {
    let handlerMock = jest.fn();
    api.on('MediaStop', handlerMock);

    api.trigger('play');
    api.trigger('destroy');

    return expect(handlerMock.mock.calls.length).toBe(1);
  });

  it('should include duration and reach', function() {
    let handlerMock = jest.fn();
    let time = 0;

    player.contentWindow.postMessage = function() {
      time++;
      env.dispatchEvent(makeEvent(`currentTime::${time}`));
    };

    api.on('MediaStop', handlerMock);

    let result = new Promise((res) => {
      setTimeout(() => {
        api.trigger('complete');

        res();
      }, 2000);
    });

    api.trigger('play');

    return result.then(() => {
      return expect(handlerMock.mock.calls[0][0]).toEqual({secondsPlayed: 1, secondsReached: 2});
    });
  });
});

describe('Progress tracking', function() {
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

  it('should reset duration and reach on MediaStop', function() {
    let handlerMock = jest.fn();
    let time = 0;

    player.contentWindow.postMessage = function() {
      time++;
      env.dispatchEvent(makeEvent(`getPosition::${time}`));
    };

    api.on('MediaStop', handlerMock);

    let result = new Promise((res) => {
      setTimeout(() => {
        api.trigger('complete');
        api.trigger('play');
        api.trigger('complete');
        res();
      }, 2000);
    });

    api.trigger('play');

    return result.then(() => {
      return expect(handlerMock.mock.calls[1][0]).toEqual({secondsPlayed: 0, secondsReached: 0});
    });
  });
});
