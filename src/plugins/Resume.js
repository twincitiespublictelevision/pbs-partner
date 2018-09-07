export default function Resume(controls) {
  let { get, set, del } = controls;

  if (typeof get !== 'function' ||
      typeof set !== 'function' ||
      typeof del !== 'function') {
    get = (id) => window.localStorage.getItem('resume')[id];
    set = (id, val) => {
      let data = window.localStorage.getItem('resume');
      data[id] = val;
      window.localStorage.setItem('resume', data);
    };
    del = (id) => {
      let data = window.localStorage.getItem('resume');
      delete data[id];
      window.localStorage.setItem('resume', data);
    };
  }

  return function(player) {
    this._player = player;
    this._player.on('position', val => {
      let id = player.getVideoId();

      if (id) {
        set(id, Math.floor(val));
      }
    });
    this._player.on('MediaStop', val => {
      let id = player.getVideoId();

      if (id) {
        set(id, Math.floor(val.secondsReached));
      }
    });
    this._player.on('play', () => {
      let id = player.getVideoId();

      if (id) {
        let pos = get(id);

        if (pos) {
          this._player.seek(pos);
        }
      }
    });
  };
}