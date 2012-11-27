jsdom = require("jsdom").jsdom;
location = require("location");
doc = jsdom();

window = doc.createWindow();

window.location = location

window.history =
  replaceState: (state, title, pathname)->
    window.location.pathname = pathname
    require("../pather").checkAll()

global.window = window
global.document = window.document
global.navigator =
  userAgent: ""


