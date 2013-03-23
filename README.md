# Pather.js

*Subscribe to changes in window.location*

[![Build Status](https://secure.travis-ci.org/bjoerge/pather.png)](http://travis-ci.org/bjoerge/pather)

Works in browsers supporting the HTML5 History API. Include a polyfill like [devote/HTML5-History-API](https://github.com/devote/HTML5-History-API)
to make it work in oldIE.

# Features

## Get notified when the user enter a path

```js
pather.on("enter", "/foo/bar", function(ev) {
  console.log("Enter /foo/bar");
})
```
var main = pather.route("/foo/bar"); 
main
  .once("enter", function(ev) {
    console.log("Entering /foo/bar for the first time")
  })
  .on("enter", function(ev) {
    ev.params
    ev.namedParams
    console.log("Entered /foo/bar");
  })
  .on("leave", function() {
    console.log("Left /foo/bar");  
  });
```
## Get notified when the user leave a path

```js
pather.on("leave", "/foo/bar", function() {
  console.log("Enter /foo/bar");
})
```

## Capture named parameters (Sinatra/Backbone style)

```js
pather.on("enter", "/foo/:a/:b", function(a, b) {
  console.log("Enter /foo/"+a+"/"+b);
})

window.history.pushState({}, null, "/foo/bar/baz")
```

## Match against other aspects of the url, i.e. the query string:

```js
pather.on("enter", "/foo/:a/:b?fruit=:fruit", function(a, b, fruit) {
  console.log("Mmm, ", fruit);
});

window.history.pushState({}, null, "/foo/bar/baz?fruit=banana&vegetable=cauliflower")
```

# Or, just get the full query string as a hash

The url decoded query string are always passed as the last argument to the callback function 

```js
pather.on("enter", "/foo", function(params) {
  console.log("Fruit: ", params.fruit);
  console.log("Vegetable: ", params.vegetable);
})

window.history.pushState({}, null, "/foo?fruit=banana&vegetable=cauliflower")
```

# Use regexps

```js
pather.on("enter", /^\/(foo|bar)$/, function(fooOrBar) {
  console.log("Was it foo or was it bar? *drumroll* it was ", fooOrBar);
})

window.history.pushState({}, null, "/bar")
window.history.pushState({}, null, "/qux")
```

## You can also match against the location hash:
[Try in jsfiddle](http://jsfiddle.net/bjoerge/Ry7L9/5/embedded/result/)

```js
pather.on("/fruits/:fruit/#:bookmark", function(fruit, bookmark) {
  console.log('Now display the "%s" section of the page about the "%s"', bookmark, fruit);
});

window.history.pushState({}, null, "/fruits/banana/")
window.location.hash = "nutrition_facts"
```

Note: events will trigger *only* when captured params are changed

I.e the following will only trigger once:

```js
pather.on("/foo/:bar", function(bar) {
  console.log('The bar is ', bar)
});

window.history.pushState({}, null, "/foo/banana?vegetable=broccoli")

window.history.pushState({}, null, "/foo/banana?vegetable=cauliflower")
```

To let the event trigger whenever something in the query string changes, use the wildcard/splat instead
```js
pather.on("/foo?*", function(bar, params) {
  console.log('A parameter has changed', params)
});

window.history.pushState({}, null, "/foo?vegetable=cauliflower") // will trigger
window.history.pushState({}, null, "/foo?vegetable=cauliflower&fruit=banana")  // will not trigger
```

Or even a combination (note: the &* must always be at the end of the route string)
```js
pather.on("/foo?vegetable=:vegetable&*", function(bar, params) {
  console.log('A parameter has changed', params)
});

window.history.pushState({}, null, "/foo?vegetable=cauliflower") // will trigger
window.history.pushState({}, null, "/foo?vegetable=cauliflower&fruit=banana") // will trigger
```