# pbs-partner
[![CircleCI](https://circleci.com/gh/twincitiespublictelevision/pbs-partner/tree/master.svg?style=svg)](https://circleci.com/gh/twincitiespublictelevision/pbs-partner/tree/master) [docs](Documentation)

`pbs-partner` is a library for connecting to a PBS Partner Player instance, sending commands, and listening for events.

---

## Overview

`pbs-partner` exposes a single main function PBSPartner that can be instantiated and connected to a PBS Partner Player iframe. A
single instance maps to a single player.

Communication with the iframe occurs over via the [https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage](postMessage API).
Note that listening for messages is shared and the library attempts to match up events to the iframe instance that spawned the message. If
the src of the iframe changes, it is recommended to close the old object and instantiate a new one. Currently, binding a single iframe
to multiple PBSPartner instances is not supported.

## Usage

```javascript
let player = new PBSPartner();
player.setPlayer(document.getElementById('video-player'));

player.analytics.setTrackingFunction(ga);
player.analytics.addMediaTracking(
  'Video Player', // Event Category
  'Label for Video', // Event Label
  'metric1',
  {
    start: 'MediaStart', // Event Action - Start
    stop: 'MediaStop' // Event Action - Stop
  }
);

```

## Install

`npm install @twincitiespublictelevision/pbs-partner`

## Extending PBSPlayer

The library is split into three main parts: a Message function for sending and receiving messages, a MediaEvents function for translating
lower level events into higher level MediaStart and MediaStop events, and finally Player function for tracking durations and adding plugins.

A plugin is a function that accepts a PBSPlayer and provides additional functionality. A plugin can be added via the PBSPlayer.

```javascript
PBSPlayer.addPlugin('analytics', GoogleAnalytics);
```

PBSPlayer comes with a GoogleAnalytics plugin for tracking MediaStart and MediaStop events by default.