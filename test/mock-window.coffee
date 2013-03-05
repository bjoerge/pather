jsdom = require("jsdom").jsdom;
doc = jsdom();

window = doc.createWindow();
uparse = require("url").parse

oldSetter = Object.getOwnPropertyDescriptor(window.location, 'hash').set
# A workaround to properly trigger hashchange events when setting window.location.hash
window.location.__defineSetter__ "hash", (val)->
  val ||= ""
  val = "#"+val if val and val.charAt(0) isnt "#"
  oldSetter(val)
  ev = doc.createEvent("HashChangeEvent")
  ev.initEvent('hashchange', false, false)
  window.dispatchEvent(ev)

window.history =
  replaceState: (state, title, url)->
    parsed = uparse(url)
    window.location.pathname = parsed.pathname
    window.location.search = parsed.search
    window.location.hash = parsed.hash
    ev = doc.createEvent("PopStateEvent")
    ev.initEvent('popstate', false, false)
    window.dispatchEvent(ev)

global.window = window
global.document = window.document
global.navigator =
  userAgent: ""


