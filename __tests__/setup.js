export let origin = 'https://player.pbs.org';

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

export async function dispatch(source, event) {
  return new Promise((resolve) => {
    setTimeout(() => {
      source.dispatchEvent(event);
      resolve();
    }, 0);
  });
}

export function mockMessageEventFactoryFactory(source) {
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

export function mockPlayerFactory(state) {
  let _state = state || {},
    channel = mockMessageChannel();

  return {
    contentWindow: channel.port1
  };
}

export function mockWindowFactory() {
  let x = document.createElement(null);

  x.navigator = {
    userAgent: ''
  };

  return x;
}