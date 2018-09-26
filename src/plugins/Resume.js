export default function Resume(controls) {
  let { get, set, del } = controls;

  if (typeof get !== 'function' ||
      typeof set !== 'function' ||
      typeof del !== 'function') {
    get = (id) => {
      try {
        let data = window.localStorage.getItem('resume');

        if (data) {
          return JSON.parse(data)[id];
        }
      } catch (_) {}

      return null;
    };

    set = (id, val) => {
      let data;

      try {
        data = JSON.parse(window.localStorage.getItem('resume'));
      } catch (_) {}

      if (!data) {
        data = {};
      }

      data[id] = val;

      window.localStorage.setItem('resume', JSON.stringify(data));
    };

    del = (id) => {
      try {
        let data = JSON.parse(window.localStorage.getItem('resume'));

        if (data) {
          delete data[id];
          window.localStorage.setItem('resume', data);
        }
      } catch (_) {}
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
    this._player.on('play', () => {
      let id = player.getVideoId();

      if (id) {
        let pos = get(id);

        if (pos) {
          this._player.seek(pos);
        }
      }
    });
    this._player.on('complete', () => {
      let id = player.getVideoId();

      if (id) {
        del(id);
      }
    })
  };
}