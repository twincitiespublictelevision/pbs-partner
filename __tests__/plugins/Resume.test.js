import PBSPlayer from '../../src/PBSPlayer';
import Resume from "../../src/plugins/Resume";
import { origin, mockPlayerFactory, mockWindowFactory, mockMessageEventFactoryFactory } from "../setup";

let storage = [];
const get = (id) => storage[id];
const set = (id, val) => storage[id] = val;
const del = (id) => delete storage[id];

describe('Resume', function() {
  let env,
    player,
    api,
    messageMock,
    makeEvent,
    videoId;

  beforeEach(function() {
    storage = [];
    videoId = 'abc-123-def-456';

    messageMock = jest.fn();
    player = mockPlayerFactory();
    player.contentWindow.postMessage = messageMock;

    env = mockWindowFactory();

    PBSPlayer.addPlugin('resume', Resume({get, set, del}));
    api = new PBSPlayer({player: player, env: env});
    api.setVideoId(videoId);
    api.setPlayer(player);

    makeEvent = mockMessageEventFactoryFactory(player.contentWindow);
  });

  it('should record progress on position events', function() {
    env.dispatchEvent(makeEvent('currentTime::1234'));

    return expect(get(videoId)).toEqual(1234);
  });

  it('should only record integers', function() {
    env.dispatchEvent(makeEvent('currentTime::1234.5678'));

    return expect(get(videoId)).toEqual(1234);
  });

  it('should not call seek on play if progress time does not exist', function() {
    api.trigger('play');

    return expect(messageMock.mock.calls).not.toEqual(expect.arrayContaining([['setCurrentTime::1234', 'https://player.pbs.org']]));
  });

  it('should call seek on play if progress time exists', function() {
    set(videoId, 1234);
    api.trigger('play');

    return expect(messageMock.mock.calls).toEqual(expect.arrayContaining([['setCurrentTime::1234', 'https://player.pbs.org']]));
  });

  it('should clear progress on complete', function() {
    env.dispatchEvent(makeEvent('currentTime::1234'));

    expect(get(videoId)).toEqual(1234);

    env.dispatchEvent(makeEvent('video::finished'));

    expect(get(videoId)).toEqual(undefined);
  });
});