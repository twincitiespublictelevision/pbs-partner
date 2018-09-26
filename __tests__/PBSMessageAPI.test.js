import PBSMessageAPI from './../src/PBSMessageAPI';
import { origin, mockPlayerFactory, mockWindowFactory, mockMessageEventFactoryFactory } from "./setup";

describe('setPlayer', function() {

  let env,
      player,
      api,
      eventFactory,
      noop,
      bindMock,
      makeEvent;

  beforeEach(function() {
    bindMock = jest.fn();
    player = mockPlayerFactory();
    env = mockWindowFactory();
    env.addEventListener = bindMock;
    api = new PBSMessageAPI({env: env});
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  it('should trigger create if a player is passed in', function() {
    let createMock = jest.fn();
    api.on('create', createMock);
    api.setPlayer(player);

    return expect(createMock.mock.calls.length).toBe(1);
  });

  it('should not trigger create if a player is not passed in', function() {
    let createMock = jest.fn();
    api.on('create', createMock);
    api.setPlayer();

    return expect(createMock.mock.calls.length).toBe(0);
  });

  it('should not trigger create if a player without a contentWindow is not passed in', function() {
    let createMock = jest.fn();
    player.contentWindow = null;
    api.on('create', createMock);
    api.setPlayer(player);

    return expect(createMock.mock.calls.length).toBe(0);
  });

  it('should listen for message events from the env', function() {
    api.setPlayer(player);

    return expect(bindMock.mock.calls.map(c => [c[0]])[0]).toEqual(['message']);
  });

  it('should listen for pagehide from the env on iPhone', function() {
    env.navigator.userAgent = 'iPhone';
    api = new PBSMessageAPI({env: env});
    api.setPlayer(player);

    return expect(bindMock.mock.calls.map(c => [c[0]])).toEqual([['message'], ['pagehide']]);
  });

  it('should listen for pagehide from the env on iPad', function() {
    env.navigator.userAgent = 'iPad';
    api = new PBSMessageAPI({env: env});
    api.setPlayer(player);

    return expect(bindMock.mock.calls.map(c => [c[0]])).toEqual([['message'], ['pagehide']]);
  });

  it('should listen for beforeunload from the env on non-iOS', function() {
    env.navigator.userAgent = '';
    api = new PBSMessageAPI({env: env});
    api.setPlayer(player);

    return expect(bindMock.mock.calls.map(c => [c[0]])).toEqual([['message'], ['beforeunload']]);
  });

  it('should trigger destroy if a player is already set', function() {
    let destroyMock = jest.fn();
    api.setPlayer(player);
    api.on('destroy', destroyMock);
    api.setPlayer(player);

    return expect(destroyMock.mock.calls.length).toBe(1);
  });

  it('should not trigger destroy if a player is not already set', function() {
    let destroyMock = jest.fn();
    api.on('destroy', destroyMock);
    api.setPlayer(player);

    return expect(destroyMock.mock.calls.length).toBe(0);
  });
});

describe('on', function() {

  let env,
      player,
      api,
      eventFactory,
      makeEvent;

  beforeEach(function() {
    player = mockPlayerFactory();
    env = mockWindowFactory();
    api = new PBSMessageAPI({env: env});
    api.setPlayer(player);
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  it('should return a self reference', function() {
    return expect(api).toEqual(api.on('play', function() {}));
  });

  it('should call all handlers that are bound to an event', function() {
    let handlerMock = jest.fn();
    api.on('play', handlerMock);
    env.dispatchEvent(makeEvent('video::playing'));

    return expect(handlerMock.mock.calls.length).toBe(1);
  });

  it('should not call handlers that are bound to other events', function() {
    let handlerMock = jest.fn();
    api.on('play', handlerMock);
    env.dispatchEvent(makeEvent('video::paused'));

    return expect(handlerMock.mock.calls.length).toBe(0);
  });
});

describe('off', function() {

  var env,
      player,
      api,
      eventFactory,
      makeEvent;

  beforeEach(function() {
    player = mockPlayerFactory();
    env = mockWindowFactory();
    api = new PBSMessageAPI({env: env});
    api.setPlayer(player);
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  it('should return a self reference', function() {
    return expect(api).toEqual(api.on('play', function() {}));
  });

  it('should not call handlers that are unbound', function() {
    let handlerMock = jest.fn();
    api.on('play', handlerMock);
    api.off('play', handlerMock);
    env.dispatchEvent(makeEvent('video::playing'));

    return expect(handlerMock.mock.calls.length).toBe(0);
  });

  it('should unbind handler from only the passed in event', function() {
    var handlerMock1 = jest.fn(),
        handlerMock2 = jest.fn();
    api.on('play', handlerMock1);
    api.on('pause', handlerMock2);
    api.off('play', handlerMock1);
    env.dispatchEvent(makeEvent('video::paused'));

    expect(handlerMock1.mock.calls.length).toBe(0);
    return expect(handlerMock2.mock.calls.length).toBe(1);
  });

  it('should unbind only the passed in handler', function() {
    var handlerMock1 = jest.fn(),
        handlerMock2 = jest.fn();
    api.on('play', handlerMock1);
    api.on('play', handlerMock2);
    api.off('play', handlerMock1);
    env.dispatchEvent(makeEvent('video::playing'));

    expect(handlerMock1.mock.calls.length).toBe(0);
    return expect(handlerMock2.mock.calls.length).toBe(1);
  });

  it('should unbind all handlers from event if no handler is passed in', function() {
    var handlerMock1 = jest.fn(),
        handlerMock2 = jest.fn();
    api.on('play', handlerMock1);
    api.on('play', handlerMock2);
    api.off('play');
    env.dispatchEvent(makeEvent('video::playing'));

    expect(handlerMock1.mock.calls.length).toBe(0);
    return expect(handlerMock2.mock.calls.length).toBe(0);
  });

  it('should not unbind handlers from other events if no handler is passed in', function() {
    var mockHandler1 = jest.fn(),
        mockHandler2 = jest.fn();
    api.on('play', mockHandler1);
    api.on('pause', mockHandler2);
    api.off('play');
    env.dispatchEvent(makeEvent('video::paused'));

    expect(mockHandler1.mock.calls.length).toBe(0);
    return expect(mockHandler2.mock.calls.length).toBe(1);
  });

  it('should unbind all handlers from all events if no event or handler is passed in', function() {
    var mockHandler1 = jest.fn(),
        mockHandler2 = jest.fn();
    api.on('play', mockHandler1);
    api.on('pause', mockHandler2);
    api.off();
    env.dispatchEvent(makeEvent('video::playing'));
    env.dispatchEvent(makeEvent('video::paused'));

    expect(mockHandler1.mock.calls.length).toBe(0);
    return expect(mockHandler2.mock.calls.length).toBe(0);
  });
});

describe('destroy', function() {

  let env,
      player,
      api,
      eventFactory,
      removeMock,
      makeEvent;

  beforeEach(function() {
    removeMock = jest.fn();
    player = mockPlayerFactory();
    env = mockWindowFactory();
    env.removeEventListener = removeMock;
    api = new PBSMessageAPI({env: env});
    api.setPlayer(player);
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  it('should emit a destroy event', function() {
    let destroyMock = jest.fn();
    api.on('destroy', destroyMock);
    api.destroy();

    return expect(destroyMock.mock.calls.length).toBe(1);
  });

  it('should unbind all bound handlers', function() {
    var mockHandler1 = jest.fn(),
        mockHandler2 = jest.fn();
    api.on('play', mockHandler1);
    api.on('pause', mockHandler2);
    api.destroy();
    env.dispatchEvent(makeEvent('video::playing'));
    env.dispatchEvent(makeEvent('video::paused'));

    expect(mockHandler1.mock.calls.length).toBe(0);
    return expect(mockHandler2.mock.calls.length).toBe(0);
  });

  it('should stop listening for message events from the env', function() {
    api = new PBSMessageAPI({env: env});
    api.setPlayer(player);
    api.destroy();

    return expect(removeMock.mock.calls.map(c => c[0])).toEqual(['message', 'beforeunload']);
  });

  it('should stop listening for pagehide from the env on iPhone', function() {
    env.navigator.userAgent = 'iPhone';
    api = new PBSMessageAPI({env: env});
    api.setPlayer(player);
    api.destroy();

    return expect(removeMock.mock.calls.map(c => c[0])).toEqual(['message', 'pagehide']);
  });

  it('should stop listening for pagehide from the env on iPad', function() {
    env.navigator.userAgent = 'iPad';
    api = new PBSMessageAPI({env: env});
    api.setPlayer(player);
    api.destroy();

    return expect(removeMock.mock.calls.map(c => c[0])).toEqual(['message', 'pagehide']);
  });

  it('should stop listening for beforeunload from the env on non-iOS', function() {
    env.navigator.userAgent = '';
    api = new PBSMessageAPI({env: env});
    api.setPlayer(player);
    api.destroy();

    return expect(removeMock.mock.calls.map(c => c[0])).toEqual(['message', 'beforeunload']);
  });
});

describe('fetch methods', function() {

  var env,
      player,
      api,
      eventFactory,
      messageMock,
      makeEvent;

  beforeEach(function() {
    messageMock = jest.fn();
    player = mockPlayerFactory();
    player.contentWindow.postMessage = messageMock;
    env = mockWindowFactory();
    api = new PBSMessageAPI({env: env});
    api.setPlayer(player);
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  var methodTests = [
    {method: 'getState', message: 'getState', defaultValue: 0, returnValue: 23},
    {method: 'getPosition', message: 'getPosition', defaultValue: 0, returnValue: 23},
    {method: 'getDuration', message: 'getDuration', defaultValue: 0, returnValue: 23},
    {method: 'getMute', message: 'getMute', defaultValue: false, returnValue: true},
    {method: 'getVolume', message: 'getVolume', defaultValue: 0, returnValue: 23},
    {method: 'getCurrentCaptions', message: 'getCurrentCaptions', defaultValue: 0, returnValue: 23},
    {method: 'getCurrentQuality', message: 'getCurrentQuality', defaultValue: 0, returnValue: 23}
  ];

  methodTests.forEach(function(test) {
    describe(test.method, function() {
      it('should send a ' + test.message + ' message to the player', function() {
        api[test.method]();

        return expect(messageMock.mock.calls).toEqual([[test.message, origin]]);
      });

      it('should resolve to ' + test.returnValue + ' when player succeeds', function() {
        let result = api[test.method]();
        env.dispatchEvent(makeEvent(test.message + '::' + test.returnValue));

        return result.then(function(response) {
          return expect(response).toEqual(test.returnValue);
        });
      });
    });
  });
});

describe('control methods', function() {

  var env,
      player,
      api,
      eventFactory,
      messageMock,
      makeEvent;

  beforeEach(function() {
    messageMock = jest.fn();
    player = mockPlayerFactory();
    player.contentWindow.postMessage = messageMock;
    env = mockWindowFactory();
    api = new PBSMessageAPI({env: env});
    api.setPlayer(player);
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  describe('togglePlayState', function() {
    it('should send either a play or a pause message to the player', function() {
      api.togglePlayState();

      // TODO: How do we test that either play or pause was the argument
      return expect(messageMock.mock.calls).toEqual([['play', origin]]);
    });

    it('should resolve to null', function() {
      var result = api.togglePlayState();

      return result.then(function(response) {
        expect(response).toBeNull();
      })
    });
  });

  describe('play', function() {
    it('should send a play message to the player if the player is not playing', function() {
      var result = api.play();
      env.dispatchEvent(makeEvent('getState::paused'));

      return result
        .then(function(response) {
          expect(messageMock.mock.calls.length).toBe(2);
          expect(messageMock.mock.calls).toEqual(expect.arrayContaining([['play', origin]]));
          return expect(response).toBeNull();
        });
    });

    it('should not send a play message to the player if the player is playing', function() {
      var result = api.play();
      env.dispatchEvent(makeEvent('getState::playing'));

      return result.then(function(response) {
        expect(messageMock.mock.calls.length).toBe(1);
        expect(messageMock.mock.calls).not.toEqual(expect.arrayContaining([['play', origin]]));
        return expect(response).toBeNull();
      });
    });

    it('should resolve to null', function() {
      var result = api.play();
      env.dispatchEvent(makeEvent('getState::playing'));

      return result.then(function(response) { return expect(response).toBeNull(); });
    });
  });

  describe('pause', function() {
    it('should send a pause message to the player if the player is playing', function() {
      var result = api.pause();
      env.dispatchEvent(makeEvent('getState::playing'));

      return result.then(function(response) {
        expect(messageMock.mock.calls.length).toBe(2);
        expect(messageMock.mock.calls).toEqual(expect.arrayContaining([['pause', origin]]));
        return expect(response).toBeNull();
      });
    });

    it('should not send a pause message to the player if the player is not playing', function() {
      var result = api.pause();
      env.dispatchEvent(makeEvent('getState::paused'));

      return result.then(function(response) {
        expect(messageMock.mock.calls.length).toBe(1);
        expect(messageMock.mock.calls).not.toEqual(expect.arrayContaining([['pause', origin]]));
        return expect(response).toBeNull();
      });
    });

    it('should resolve to null', function() {
      var result = api.pause();
      env.dispatchEvent(makeEvent('getState::paused'));

      return result.then(function(response) { return expect(response).toBeNull(); });
    });
  });

  var methodTests = [
    {method: 'seek', message: 'seek', arg: 3},
    {method: 'stop', message: 'stop'},
    {method: 'setCurrentCaptions', message: 'setCurrentCaptions', arg: 3},
    {method: 'setMute', message: 'setMute'},
    {method: 'setVolume', message: 'setVolume', arg: 3},
    {method: 'setCurrentCaptions', message: 'setCurrentCaptions', arg: 3},
    {method: 'setCurrentQuality', message: 'setCurrentQuality', arg: 3}
  ];

  methodTests.forEach(function(test) {
    describe(test.method, function() {
      if (typeof test.arg !== 'undefined') {
        it('should send a ' + test.message + ' message to the player with argument ' + test.arg, function() {
          api[test.method](test.arg);

          return expect(messageMock.mock.calls).toEqual([[test.message + '::' + test.arg, origin]]);
        });
      } else {
        it('should send a ' + test.message + ' message to the player', function() {
          api[test.method]();

          return expect(messageMock.mock.calls).toEqual([[test.message, origin]]);
        });
      }

      it('should resolve to null', function() {
        var result = api[test.method]();

        return result.then(function(response) { return expect(response).toBeNull(); });
      });
    });
  });
});

describe('utility', function() {

  var env,
      player,
      api,
      eventFactory,
      messageMock,
      makeEvent;

  beforeEach(function() {
    messageMock = jest.fn();
    player = mockPlayerFactory();
    player.contentWindow.postMessage = messageMock;
    env = mockWindowFactory();
    api = new PBSMessageAPI({env: env});
    api.setPlayer(player);
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  describe('isPlaying', function() {
    it('should resolve to false when state is not playing', function() {
      var result = api.isPlaying();
      env.dispatchEvent(makeEvent('getState::paused'));

      return result.then(function(response) {
        return expect(response).toBe(false);
      });
    });

    it('should resolve to true when state is playing', function() {
      var result = api.isPlaying();
      env.dispatchEvent(makeEvent('getState::playing'));

      return result.then(function(response) {
        return expect(response).toBe(true);
      });
    });
  });
});
