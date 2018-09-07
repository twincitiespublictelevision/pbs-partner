import PBSPlayer from './../src/PBSPlayer';
import Resume from "../src/plugins/Resume";

let origin = 'https://player.pbs.org';

function mockMessagePort() {
  return {
    postMessage: function() {}
  }
}

function mockMessageChannel() {
  return {
    port1: mockMessagePort(),
    port2: mockMessagePort()
  }
}

function mockMessageEventFactoryFactory(source) {
  return function(eventData) {
    return new MessageEvent(
      'message',
      {
        data: eventData,
        origin: origin,
        source: source
      }
    );
  };
}

function mockPlayerFactory(state) {
  let _state = state || {},
    channel = mockMessageChannel();

  return {
    contentWindow: channel.port1
  };
}

function mockWindowFactory() {
  let x = document.createElement(null);

  x.navigator = {
    userAgent: ''
  };

  return x;
}

let storage = [];
const get = (id) => storage[id];
const set = (id, val) => storage[id] = val;
const del = (id) => delete storage[id];

describe('Resume', function() {
  let env,
    player,
    api,
    eventFactory,
    noop,
    bindMock,
    makeEvent,
    videoId;

  beforeEach(function() {
    storage = [];
    videoId = 'abc-123-def-456';
    bindMock = jest.fn();
    player = mockPlayerFactory();
    env = mockWindowFactory();
    env.addEventListener = bindMock;
    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
    PBSPlayer.addPlugin('resume', Resume({get, set, del}));
    api = new PBSPlayer({env: env});
    api.setVideoId(videoId);
    api.setPlayer(player);
  });

  it('is true', function() {
    expect(true).toEqual(true);
  })

  //
  // it('should record location on position events', function() {
  //   env.dispatchEvent(makeEvent('getPosition::1234'));
  //   expect(get(videoId)).toEqual(1234);
  // });
  //
  // it('should record location on MediaStops', function() {
  //   player.trigger('MediaStop', { secondsReached: 1234 });
  //   expect(get(videoId)).toEqual(1234);
  // });
  //
  // it('should call seek on play', function() {
  //
  // });
});