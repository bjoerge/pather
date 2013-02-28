jsdom = require("jsdom").jsdom;
doc = jsdom();

window = doc.createWindow();

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
  replaceState: (state, title, pathname)->
    window.location.pathname = pathname
    ev = doc.createEvent("PopStateEvent")
    ev.initEvent('popstate', false, false)
    window.dispatchEvent(ev)

global.window = window
global.document = window.document
global.navigator =
  userAgent: ""


