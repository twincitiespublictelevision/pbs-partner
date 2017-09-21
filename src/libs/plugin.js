import mixin from './mixin';

function Plugin() {
}

Plugin.prototype.plugin = function plugin(namespace, plugin, args) {
  this[namespace] = new (plugin.bind.apply(plugin, [null].concat(args)));
};

export default {
  mixin: mixin(
    ['plugin'],
    Plugin
  )
};