# Pather.js

*Drop-dead simple window.location.pathname listener*

[![Build Status](https://secure.travis-ci.org/bjoerge/pather.png)](http://travis-ci.org/bjoerge/pather)

#### Disclaimer: This is work in progress

Works in browsers supporting the HTML5 History API, for older browsers, a polyfill like [devote/HTML5-History-API](https://github.com/devote/HTML5-History-API)
is required.

# Examples

## Simple
```js
Path.on("/foo/bar", function() {
  console.log("Enter /foo/bar");
})

window.history.pushState({}, null, "/foo/bar")
```

## Named parameters (Sinatra/Backbone style)
[View this example in jsfiddle](http://jsfiddle.net/A65uJ/2/embedded/result/)
```js
Path.on("/foo/:a/:b", function(a, b) {
  console.log("Enter /foo/"+a+"/"+b);
})

window.history.pushState({}, null, "/foo/bar/baz")
```