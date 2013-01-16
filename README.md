# Pather.js

*Subscribe to changes in window.location*

[![Build Status](https://secure.travis-ci.org/bjoerge/pather.png)](http://travis-ci.org/bjoerge/pather)

#### Disclaimer: This is work in progress

Works in browsers supporting the HTML5 History API, for older browsers, a polyfill like [devote/HTML5-History-API](https://github.com/devote/HTML5-History-API)
is required.

# Examples

## Simple

```js
Pather.on("/foo/bar", function() {
  console.log("Enter /foo/bar");
})

window.history.pushState({}, null, "/foo/bar")
```

## Named parameters (Sinatra/Backbone style)

```js
Pather.on("/foo/:a/:b", function(a, b) {
  console.log("Enter /foo/"+a+"/"+b);
})

window.history.pushState({}, null, "/foo/bar/baz")
```

## You can also match against the location hash:
[Try in jsfiddle](http://jsfiddle.net/bjoerge/Ry7L9/5/embedded/result/)

```js
Pather.on("/fruits/:fruit/#:bookmark", function(fruit, bookmark) {
  console.log('Now display the "%s" section of the page about the "%s"', bookmark, fruit);
});

window.history.pushState({}, null, "/fruits/banana/")
window.location.hash = "nutrition_facts"
```