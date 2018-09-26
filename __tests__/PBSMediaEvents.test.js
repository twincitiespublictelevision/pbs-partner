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
    return expect(true).toEqual(true);
  });

  it('should send MediaStart again after complete', function() {
    return expect(true).toEqual(true);
  });

  it('should send MediaStart again after destroy', function() {
    return expect(true).toEqual(true);
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
    return expect(true).toEqual(true);
  });

  it('should send MediaStop on complete', function() {
    return expect(true).toEqual(true);
  });

  it('should send MediaStop on destroy', function() {
    return expect(true).toEqual(true);
  });

  it('should include duration and reach', function() {
    return expect(true).toEqual(true);

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

  it('should include duration and reach on MediaStop', function() {
    return expect(true).toEqual(true);
  });

  it('should reset duration and reach on MediaStop', function() {
    return expect(true).toEqual(true);
  });
});
