var mixin = require('./mixin.js');

function Plugin() {
}

Plugin.prototype.plugin = function plugin(namespace, plugin, args) {
  this[namespace] = new (plugin.bind.apply(plugin, [null].concat(args)));
};

module.exports = {
  mixin: mixin(
    ['plugin'],
    Plugin
  )
};