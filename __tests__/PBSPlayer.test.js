import PBSPlayer from '../src/PBSPlayer';
import { origin, mockPlayerFactory, mockWindowFactory, mockMessageEventFactoryFactory, dispatch } from "./setup";

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

  it('should trigger complete when pause occurs at end of video', async function() {
    let handlerMock = jest.fn();
    
    api.on('complete', () => {
      handlerMock();
    });
    
    await dispatch(env, makeEvent('video::playing'));
    await dispatch(env, makeEvent('duration::5'));
    await dispatch(env, makeEvent('video::paused'));
    await dispatch(env, makeEvent('currentTime::5'));

    // Emit an arbitrary event to force the duration callback
    // to be processed
    await dispatch(env, makeEvent('unhandled'));

    expect(handlerMock.mock.calls.length).toBe(1);
  });
});

describe('Duration tracking', function() {
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
  
  test('Should record full video duration', async () => {
    await dispatch(env, makeEvent('video::playing'));
    await dispatch(env, makeEvent('duration::5'));

    // Emit an arbitrary event to force the duration callback
    // to be processed
    await dispatch(env, makeEvent('unhandled'));

    expect(api._trackingFullVideoDuration).toBe(5);
  });
});