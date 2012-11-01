# Path listener

*Drop-dead simple window.location.pathname listener*

[![Build Status](https://secure.travis-ci.org/bjoerge/path-listener.png)](http://travis-ci.org/bjoerge/path-listener)

#### Disclaimer: This is work in progress. At the moment it is NSFW.

Missing features are:
- Hash based path fallback for older browsers

# Examples

## Simple
```js
Path.on("/foo/bar", function() {
  console.log("Enter /foo/bar");
})

window.history.pushState({}, null, "/foo/bar")
```

## Named parameters (Sinatra/Backbone style)

```js
Path.on("/foo/:a/:b", function(a, b) {
  console.log("Enter /foo/"+a+"/"+b);
})
```