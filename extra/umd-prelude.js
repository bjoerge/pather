// Universal Module Loader (Based on https://gist.github.com/wilmoore/3880415)
!(function (name, context, definition) {
  if (typeof exports == 'object') {
    module.exports = definition(require);
  } else if (typeof define == 'function' && define.amd) {
    define(definition);
  } else if (typeof YUI == "function") {
    YUI.add(name, definition, '@VERSION@', {requires: []});
  } else {
    context[name] = definition();
  }
}).call(this, 'Pather', this, function (require) {
