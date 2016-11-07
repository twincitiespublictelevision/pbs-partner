var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var chaiSpies = require('chai-spies');

chai.use(chaiAsPromised);
chai.use(chaiSpies);

var COVEMessageAPI = require('./../src/COVEMessageAPI');

var expect = chai.expect;

function mockMessageEventFactoryFactory(source) {

  return function(eventData) {
    return new MessageEvent(
      'message',
      {
        data: eventData,
        origin: 'http://player.pbs.org',
        source: source
      }
    );
  };
};

function mockPlayerFactory(state) {
  var _state = state || {},
      channel = new MessageChannel();

  return {
    contentWindow: channel.port1
  };
};

function mockWindowFactory() {
  var x = document.createElement(null);

  x.navigator = {
    userAgent: ''
  };

  return x;
};

describe('setPlayer', function() {

  var env,
      player,
      api,
      eventFactory,
      noop,
      spy;

  before(function() {
    noop = function noop() {};
  });

  beforeEach(function() {
    spy = chai.spy(noop)
    player = mockPlayerFactory();
    env = mockWindowFactory();
    env.addEventListener = spy;
    api = new COVEMessageAPI({env: env});
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  it('should trigger create if a player is passed in', function() {
    var createSpy = chai.spy(noop);
    api.on('create', createSpy);
    api.setPlayer(player);

    return expect(createSpy).to.have.been.called.once();
  });

  it('should not trigger create if a player is not passed in', function() {
    var createSpy = chai.spy(noop);
    api.on('create', createSpy);
    api.setPlayer();

    return expect(createSpy).to.have.not.been.called();
  });

  it('should not trigger create if a player without a contentWindow is not passed in', function() {
    var createSpy = chai.spy(noop);
    player.contentWindow = null;
    api.on('create', createSpy);
    api.setPlayer(player);

    return expect(createSpy).to.have.not.been.called();
  });

  it('should listen for message events from the env', function() {
    api.setPlayer(player);

    return expect(spy).to.have.been.called.with('message');
  });

  it('should listen for pagehide from the env on iPhone', function() {
    env.navigator.userAgent = 'iPhone';
    api = new COVEMessageAPI({env: env});
    api.setPlayer(player);

    return expect(spy).to.have.been.called.with('pagehide');
  });

  it('should listen for pagehide from the env on iPad', function() {
    env.navigator.userAgent = 'iPad';
    api = new COVEMessageAPI({env: env});
    api.setPlayer(player);

    return expect(spy).to.have.been.called.with('pagehide');
  });

  it('should listen for beforeunload from the env on non-iOS', function() {
    env.navigator.userAgent = '';
    api = new COVEMessageAPI({env: env});
    api.setPlayer(player);

    return expect(spy).to.have.been.called.with('beforeunload');
  });

  it('should trigger destroy if a player is already set', function() {
    var destroySpy = chai.spy(noop);
    api.setPlayer(player);
    api.on('destroy', destroySpy);
    api.setPlayer(player);

    return expect(destroySpy).to.have.been.called();
  });

  it('should not trigger destroy if a player is not already set', function() {
    var destroySpy = chai.spy(noop);
    api.on('destroy', destroySpy);
    api.setPlayer(player);

    return expect(destroySpy).to.have.not.been.called();
  });
});

describe('on', function() {

  var env,
      player,
      api,
      eventFactory,
      noop;

  before(function() {
    noop = function noop() {};
  });

  beforeEach(function() {
    player = mockPlayerFactory();
    env = mockWindowFactory();
    api = new COVEMessageAPI({player: player, env: env});
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  it('should return a self reference', function() {
    return expect(api).to.equal(api.on('play', function() {}));
  });

  it('should call all handlers that are bound to an event', function() {
    var spy = chai.spy(noop);
    api.on('play', spy);
    env.dispatchEvent(makeEvent('video::playing'));

    return expect(spy).to.have.been.called();
  });

  it('should not call handlers that are bound to other events', function() {
    var spy = chai.spy(noop);
    api.on('play', spy);
    env.dispatchEvent(makeEvent('video::paused'));

    return expect(spy).to.not.have.been.called();
  });
});

describe('off', function() {

  var env,
      player,
      api,
      eventFactory,
      noop;

  before(function() {
    noop = function noop() {};
  });

  beforeEach(function() {
    player = mockPlayerFactory();
    env = mockWindowFactory();
    api = new COVEMessageAPI({player: player, env: env});
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  it('should return a self reference', function() {
    return expect(api).to.equal(api.on('play', function() {}));
  });

  it('should not call handlers that are unbound', function() {
    var spy = chai.spy(noop);
    api.on('play', spy);
    api.off('play', spy);
    env.dispatchEvent(makeEvent('video::playing'));

    return expect(spy).to.not.have.been.called();
  });

  it('should unbind handler from only the passed in event', function() {
    var spy1 = chai.spy(noop),
        spy2 = chai.spy(noop);
    api.on('play', spy1);
    api.on('pause', spy2);
    api.off('play', spy1);
    env.dispatchEvent(makeEvent('video::paused'));

    expect(spy1).to.not.have.been.called();
    return expect(spy2).to.have.been.called();
  });

  it('should unbind only the passed in handler', function() {
    var spy1 = chai.spy(noop),
        spy2 = chai.spy(noop);
    api.on('play', spy1);
    api.on('play', spy2);
    api.off('play', spy1);
    env.dispatchEvent(makeEvent('video::playing'));

    expect(spy1).to.not.have.been.called();
    return expect(spy2).to.have.been.called();
  });

  it('should unbind all handlers from event if no handler is passed in', function() {
    var spy1 = chai.spy(noop),
        spy2 = chai.spy(noop);
    api.on('play', spy1);
    api.on('play', spy2);
    api.off('play');
    env.dispatchEvent(makeEvent('video::playing'));

    expect(spy1).to.not.have.been.called();
    return expect(spy2).to.not.have.been.called();
  });

  it('should not unbind handlers from other events if no handler is passed in', function() {
    var spy1 = chai.spy(noop),
        spy2 = chai.spy(noop);
    api.on('play', spy1);
    api.on('pause', spy2);
    api.off('play');
    env.dispatchEvent(makeEvent('video::paused'));

    expect(spy1).to.not.have.been.called();
    return expect(spy2).to.have.been.called();
  });

  it('should unbind all handlers from all events if no event or handler is passed in', function() {
    var spy1 = chai.spy(noop),
        spy2 = chai.spy(noop);
    api.on('play', spy1);
    api.on('pause', spy2);
    api.off();
    env.dispatchEvent(makeEvent('video::playing'));
    env.dispatchEvent(makeEvent('video::paused'));

    expect(spy1).to.not.have.been.called();
    return expect(spy2).to.not.have.been.called();
  });
});

describe('destroy', function() {

  var env,
      player,
      api,
      eventFactory,
      noop,
      removeSpy;

  before(function() {
    noop = function noop() {};
  });

  beforeEach(function() {
    removeSpy = chai.spy(noop);
    player = mockPlayerFactory();
    env = mockWindowFactory();
    env.removeEventListener = removeSpy;
    api = new COVEMessageAPI({player: player, env: env});
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  it('should emit a destroy event', function() {
    var spy = chai.spy(noop);
    api.on('destroy', spy);
    api.destroy();

    return expect(spy).to.have.been.called();
  });

  it('should unbind all bound handlers', function() {
    var spy1 = chai.spy(noop),
        spy2 = chai.spy(noop);
    api.on('play', spy1);
    api.on('pause', spy2);
    api.destroy();
    env.dispatchEvent(makeEvent('video::playing'));
    env.dispatchEvent(makeEvent('video::paused'));

    expect(spy1).to.not.have.been.called();
    return expect(spy2).to.not.have.been.called();
  });

  it('should stop listening for message events from the env', function() {
    api.setPlayer(player);
    api.destroy();

    return expect(removeSpy).to.have.been.called.with('message');
  });

  it('should stop listening for pagehide from the env on iPhone', function() {
    env.navigator.userAgent = 'iPhone';
    api = new COVEMessageAPI({player: player, env: env});
    api.destroy();

    return expect(removeSpy).to.have.been.called.with('pagehide');
  });

  it('should stop listening for pagehide from the env on iPad', function() {
    env.navigator.userAgent = 'iPad';
    api = new COVEMessageAPI({player: player, env: env});
    api.destroy();

    return expect(removeSpy).to.have.been.called.with('pagehide');
  });

  it('should stop listening for beforeunload from the env on non-iOS', function() {
    env.navigator.userAgent = '';
    api = new COVEMessageAPI({player: player, env: env});
    api.destroy();

    return expect(removeSpy).to.have.been.called.with('beforeunload');
  });
});

describe('fetch methods', function() {

  var env,
      player,
      api,
      eventFactory,
      noop,
      spy;

  before(function() {
    noop = function noop() {};
  });

  beforeEach(function() {
    spy = chai.spy(noop);
    player = mockPlayerFactory();
    player.contentWindow.postMessage = spy;
    env = mockWindowFactory();
    api = new COVEMessageAPI({player: player, env: env});
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

        return expect(spy).to.have.been.called.with(test.message);
      });

      it('should resolve to ' + test.returnValue + ' when player succeeds', function() {
        var result = api[test.method]();
        env.dispatchEvent(makeEvent(test.message + '::' + test.returnValue));

        return expect(result).to.eventually.equal(test.returnValue);
      });
    });
  });
});

describe('control methods', function() {

  var env,
      player,
      api,
      eventFactory,
      noop,
      spy;

  before(function() {
    noop = function noop() {};
  });

  beforeEach(function() {
    spy = chai.spy(noop);
    player = mockPlayerFactory();
    player.contentWindow.postMessage = spy;
    env = mockWindowFactory();
    api = new COVEMessageAPI({player: player, env: env});
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  describe('togglePlayState', function() {
    it('should send either a play or a pause message to the player', function() {
      api.togglePlayState();

      // TODO: How do we test that either play or pause was the argument
      return expect(spy).to.have.been.called.with('play');
    });

    it('should resolve to null', function() {
      var result = api.togglePlayState();

      return expect(result).to.eventually.equal(null);
    });
  });

  describe('play', function() {
    it('should send a play message to the player if the player is not playing', function() {
      var result = api.play();
      env.dispatchEvent(makeEvent('getState::paused'));

      result.then(function(response) {
        expect(spy).to.have.been.called.twice();
        expect(spy).to.have.been.called.with('play');
        return response;
      });

      return expect(result).to.eventually.equal(null);
    });

    it('should not send a play message to the player if the player is playing', function() {
      var result = api.play();
      env.dispatchEvent(makeEvent('getState::playing'));

      result.then(function(response) {
        expect(spy).to.have.been.called.once();
        return response;
      });

      return expect(result).to.eventually.equal(null);
    });

    it('should resolve to null', function() {
      var result = api.play();
      env.dispatchEvent(makeEvent('getState::playing'));

      return expect(result).to.eventually.equal(null);
    });
  });

  describe('pause', function() {
    it('should send a pause message to the player if the player is playing', function() {
      var result = api.pause();
      env.dispatchEvent(makeEvent('getState::playing'));

      result.then(function(response) {
        expect(spy).to.have.been.called.twice();
        expect(spy).to.have.been.called.with('pause');
        return response;
      });
      return expect(result).to.eventually.equal(null);
    });

    it('should not send a pause message to the player if the player is not playing', function() {
      var result = api.pause();
      env.dispatchEvent(makeEvent('getState::paused'));

      result.then(function(response) {
        expect(spy).to.have.been.called.once();
        return response;
      });

      return expect(result).to.eventually.equal(null);
    });

    it('should resolve to null', function() {
      var result = api.pause();
      env.dispatchEvent(makeEvent('getState::paused'));

      return expect(result).to.eventually.equal(null);
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

          return expect(spy).to.have.been.called.with(test.message + '::' + test.arg);
        });
      } else {
        it('should send a ' + test.message + ' message to the player', function() {
          api[test.method]();

          return expect(spy).to.have.been.called.with(test.message);
        });
      }

      it('should resolve to null', function() {
        var result = api[test.method]();

        return expect(result).to.eventually.equal(null);
      });
    });
  });
});

describe('utility', function() {

  var env,
      player,
      api,
      eventFactory,
      noop,
      spy;

  before(function() {
    noop = function noop() {};
  });

  beforeEach(function() {
    spy = chai.spy(noop);
    player = mockPlayerFactory();
    player.contentWindow.postMessage = spy;
    env = mockWindowFactory();
    api = new COVEMessageAPI({player: player, env: env});
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  describe('isPlaying', function() {
    it('should resolve to false when state is not playing', function() {
      var result = api.isPlaying();
      env.dispatchEvent(makeEvent('getState::paused'));

      return expect(result).to.eventually.equal(false);
    });

    it('should resolve to true when state is playing', function() {
      var result = api.isPlaying();
      env.dispatchEvent(makeEvent('getState::playing'));

      return expect(result).to.eventually.equal(true);
    });
  });
});
