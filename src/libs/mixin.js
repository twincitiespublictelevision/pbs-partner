export default function mixinFactory(props, source) {
  return function mixin(target) {
    for (let i = 0; i < props.length; i ++) {
      if (typeof target === 'function') {
        target.prototype[props[i]]	= source.prototype[props[i]];
      } else {
        target[props[i]] = source.prototype[props[i]];
      }
    }
    return target;
  };
};
