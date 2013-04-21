(function (root, win) {
  "use strict";

  // Cross browser addEventListener
  var addDOMListener = function (type, listener, useCapture) {
      addDOMListener = window[window.addEventListener ? 'addEventListener' : 'attachEvent'].bind(window);
      return addDOMListener(type, listener, useCapture);
    },

    // Compare two objects recursively for equality
    sig = require("sigmund"),
    deepEqual = function(o1, o2) {
      return sig(o1) == sig(o2);
    };

  var RoutePattern = require("route-pattern");

  // PatherEventListener constructor
  // Takes three parameters:
  // 
  //  * `route` which is a RouteString or a Regex with captures
  //  * `event` and is optional and can be either `enter` (default) or `leave`
  //  * `eventHandler` is the function to receive a call whenever a change matching the event type occurs
  function PatherEventListener(route, type, eventHandler) {
    if (!(this instanceof PatherEventListener)) {
      return new PatherEventListener(route, type, eventHandler);
    }

    this.route = route;

    // The 'enter' event type is default for route matching and used if third argument is omitted
    if (typeof eventHandler == 'undefined') {
      this.event = 'enter';
      this.eventHandler = type;
    }
    else {
      this.event = type;
      this.eventHandler = eventHandler;
    }

    // The route string are compiled to a regexp (if it isn't already)
    this.routePattern = new RoutePattern.fromString(route);

    // This indicates whether the listener should be removed after firing the first time or keep on firing
    // whenever it becomes active
    this.once = false;

    // Indicates whether the current listener is active
    this.active = false;

    // Store the extracted parameters from the current pathname
    this.previousMatch = null;
  }

  function Pather(options) {
    if (!(this instanceof Pather)) {
      return new Pather(options);
    }
    this.options = options || (options = {});
    this.listeners = [];

    if (!(options.hasOwnProperty('pushState') || options.pushState === false)) {
      addDOMListener('popstate', this.checkAll.bind(this));
    }
    if (!(options.hasOwnProperty('hash') || options.hash === false)) {
      addDOMListener('hashchange', this.checkAll.bind(this));
    }
  }

  // `_normalizeRoute` normalizes a route according to configured root path
  Pather.prototype._normalizeRoute = function (route) {
    var root = (this.options.root || '').replace(/\/?$/, "/?");
    return route.replace(new RegExp("^" + root), "/");
  };

  // `addListener` creates and adds a new listener for a given route, on a given event
  Pather.prototype.addListener = function addListener(route, event, eventHandler) {
    if (!(route instanceof RegExp)) {
      route = this._normalizeRoute(route);
    }
    this._add(new PatherEventListener(route, event, eventHandler));
  };

  // The `on` method is simply an alias for `addListener`
  Pather.prototype.on = function on(route, event, eventHandler) {
    this.addListener.call(this, route, event, eventHandler);
  };

  // `once` adds a listener that will be removed after it is triggered the first time
  Pather.prototype.once = function once(route, event, eventHandler) {
    var listener = new PatherEventListener(route, event, eventHandler);
    listener.once = true;
    this._add(listener);
  };

  // `removeListener` removes a listener for a given route, on a given event for a given eventHandler
  // Note that a reference to the original event handler must be passed as third parameter (or second if event is omitted)
  Pather.prototype.removeListener = function removeListener(route, event, eventHandler) {
    if (typeof eventHandler == 'undefined') {
      eventHandler = event;
      event = 'enter';
    }
    this._remove(this._find(route, event, eventHandler))
  };

  // `removeAllListeners` removes all listeners for this instance
  Pather.prototype.removeAllListeners = function removeAllListeners() {
    this.listeners = [];
  };

  // `matches` is a convenience method to check if the given regex or route string matches the current
  // document.location.pathname
  // It takes either a route string or a regexp as parameter and returns `true` or `false`
  Pather.prototype.matches = function (/* String|RegExp */ route) {
    return !!this.match(route);
  };

  // `match` matches the given regex or route string against the current document.location.pathname and return an array with the
  // values for each capturing parenthesis (if any). Returns null if there is no match.
  Pather.prototype.match = function (/* String|RegExp */ route) {
    var path = this._getPath();
    if (route instanceof RegExp) {
      var match = route.exec(path);
      if (!match) return null;
      return match.slice(1);
    }
    return RoutePattern.fromString(route).match(this._getPath());
  };

  // `has` checks whether any of the registered listeners matches the given path
  Pather.prototype.has = function (pathname) {
    return this.listeners.some(function (listener) {
      return listener.routePattern.matches(pathname);
    }, this);
  };

  // Used internally for adding a listener to the internal register
  Pather.prototype._add = function (/*PatherEventListener*/ listener) {
    this.listeners.push(listener);
    this._check(listener);
  };

  // Used internally for removing a listener from the internal register
  Pather.prototype._remove = function (/*PatherEventListener*/ listener) {
    var idx = this.listeners.indexOf(listener);
    if (idx === -1) return false;
    this.listeners.splice(idx, 1);
    return true;
  };

  // Used internally for finding a listener by `route`, `event` and `eventHandler`
  Pather.prototype._find = function (route, event, eventHandler) {
    for (var i = this.listeners.length; i--;) {
      var listener = this.listeners[i];
      if (route === listener.route && event === listener.event && eventHandler === listener.eventHandler) {
        return listener;
      }
    }
    return null;
  };

  // Used internally for getting the current path
  // It returns a combination of document.location.pathname and document.location.search adjusted for root path
  Pather.prototype._getPath = function () {
    var loc = window.location, relativeLocation;
    if (window.history["emulate"] && loc.hash && loc.hash.charAt(1) == "/") {
      relativeLocation = loc.hash.substring(1);
    }
    else {
      relativeLocation = loc.pathname + loc.search + loc.hash;
    }
    return this._normalizeRoute(relativeLocation || "/");
  };

  // Used internally for calling a listener whenever a match has occurred
  Pather.prototype._emit = function (listener, params) {
    var event = params;
    listener.eventHandler.apply(listener, [params].concat(params.params));
    if (listener.once) {
      this._remove(listener);
    }
  };

  // Used internally for checking single listeners against the current state of affairs
  // A listener for the `enter` event will be called only if all of the below conditions are met:
  // 
  // - It's route string or regex matches the current pathname
  // - It isnt currently active
  // - It's captured parameters has changes from last time it was active (todo: maybe make an option?)
  Pather.prototype._check = function (listener) {
    var path = this._getPath();
    if (listener.routePattern.matches(path)) {
      var match = listener.routePattern.match(path);
      if (listener.event === 'enter' && !(listener.active && deepEqual(listener.previousMatch, match))) {
        // This listener wasn't active on last enter, so go ahead and notify its eventHandler
        this._emit(listener, match);
      }
      // Store the result of this check until next check
      listener.active = true;
      listener.previousMatch = match;
    }
    else {
      if (listener.active && listener.event === 'leave') {
        // Its a listener for 'leave' and the regexp matched on last check
        this._emit(listener, listener.previousMatch);
        listener.previousMatch = null;
      }
      listener.active = false;
    }
  };

  Pather.prototype.checkAll = function () {
    for (var i = this.listeners.length; i--;) {
      this._check(this.listeners[i]);
    }
  };

  Pather.prototype.navigate = function(path, replace) {
    window.history[replace ? 'replaceState' : 'pushState']({}, null, path);
    this.checkAll();
    return true    
  };


  module.exports = Pather;
})(this, window);
