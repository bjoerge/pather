// Emulates a browser environment in Node.js
var jsdom = require("jsdom").jsdom;
var doc = jsdom();
var window = doc.createWindow();
var uparse = require("url").parse;
var oldSetter = Object.getOwnPropertyDescriptor(window.location, 'hash').set;

window.location.__defineSetter__("hash", function(val) {
  var ev;
  val || (val = "");
  if (val && val.charAt(0) !== "#") {
    val = "#" + val;
  }
  oldSetter(val);
  ev = doc.createEvent("HashChangeEvent");
  ev.initEvent('hashchange', false, false);
  return window.dispatchEvent(ev);
});

window.location.href = "http://foobar.org";

window.history = {};

window.history.pushState = window.history.replaceState = function(state, title, url) {
  var parsed = uparse(url);
  if (parsed.pathname) window.location.pathname = parsed.pathname;
  if (parsed.search) window.location.search = parsed.search;
  if (parsed.hash) window.location.hash = parsed.hash;
};


global.window = window;
global.document = window.document;
global.navigator = {
  userAgent: ""
};