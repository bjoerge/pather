(function (root, win) {
  "use strict";
  var
    // A few patterns recklessly stolen from Backbone.js and modified a little
    namedParam = /:\w+/g,
    splatParam = /\*\w+/g,
    subPath = /\*/g,
    escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g,

    // Convert a route string to a regular expression
    routeToRegExp = function (route) {
      var parts = route.split("?"),
          path = parts[0], 
          search = parts[1];
      
      route = path
              .replace(escapeRegExp, "\\$&")
              .replace(namedParam, "([^/]+)")
              .replace(splatParam, "(.*)?")
              .replace(subPath, ".*?")
              .replace(/\/?$/, "/?");

      if (search) {
        search = search
          .replace(escapeRegExp, "\\$&")
          .replace(namedParam, "([^/]+)")
          .replace(splatParam, "(.*)?")
          .replace(subPath, ".*?");
                route = route+"\\?"+search;
      }
      
      return new RegExp("^" + route + "$");
    },

    // Cross browser addEventListener
    addDOMListener = function (type, listener, useCapture) {
      addDOMListener = window[window.addEventListener ? 'addEventListener' : 'attachEvent'].bind(window);
      return addDOMListener(type, listener, useCapture);
    },

    // Compare two objects recursively for equality
    // Note that this a rather naive deepEqual implementation.
    // It should, however be sufficient as only strings are extracted as parameters from the pathname
    // This is derived from github.com/substack/node-deep-equal, which again is derived from the Node.js source code
    deepEqual = function (object, other) {
      if (object === other) {
        return true;
      } else if (typeof object !== 'object' && typeof other !== 'object') {
        // We are dealing with two primitives
        return object == other;
      } else {
        var keysActual = Object.getOwnPropertyNames(object),
          keysExpected = Object.getOwnPropertyNames(other),
          i;

        if (keysActual.length != keysExpected.length) return false;

        // Make sure we compare the set of keys in the same order
        keysActual.sort();
        keysExpected.sort();

        // Quickly compare keys
        for (i = keysActual.length; i--;) {
          if (keysActual[i] != keysExpected[i])
            return false;
        }
        for (i = keysActual.length; i--;) {
          var key = keysActual[i];
          if (!deepEqual(object[key], other[key])) return false;
        }
        return true;
      }
    };

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
    this.regexp = (route instanceof RegExp) ? route : routeToRegExp(route);

    // This indicates whether the listener should be removed after firing the first time or keep on firing
    // whenever it becomes active
    this.once = false;

    // Indicates whether the current listener is active
    this.active = false;

    // Store the extracted parameters from the current pathname
    this.currentParams = null;
  }

  function Pather(options) {
    if (!(this instanceof Pather)) {
      return new Pather(options);
    }
    this.options = options || (options = {});
    this.listeners = [];

    if (!(options.hasOwnProperty('pushState') || options.pushState === false)) {
      addDOMListener('popstate', this._checkAll.bind(this));
    }
    if (!(options.hasOwnProperty('hash') || options.hash === false)) {
      addDOMListener('hashchange', this._checkAll.bind(this));
    }
  }

  // `addListener` creates and adds a new listener for a given route, on a given event
  Pather.prototype.addListener = function addListener(route, event, eventHandler) {
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
    var regexp = (route instanceof RegExp) ? route : routeToRegExp(route);
    var matches = regexp.exec(this._getPath());
    return matches && matches.slice(1);
  };

  // `has` checks whether any of the registered listeners matches the given path
  Pather.prototype.has = function (pathname) {
    return this.listeners.some(function (listener) {
      return listener.regexp.test(pathname);
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
  Pather.prototype._getPath = function() {
    var loc = window.location;
    var pathname = loc.pathname + loc.hash + loc.search;
    console.log(pathname)
    return pathname || "/";
  };

  // Used internally for calling a listener whenever a match has occurred
  Pather.prototype._call = function (listener, params) {
    listener.eventHandler.apply(listener, params);
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
    if (listener.regexp.test(path)) {
      // Todo: also capture search params
      var params = listener.regexp.exec(path).slice(1);
      if (listener.event === 'enter' && !(listener.active && deepEqual(listener.previousParams, params))) {
        // This listener wasn't active on last enter, so go ahead and notify its eventHandler
        this._call(listener, params);
      }
      // Store the result of this check until next check
      listener.active = true;
      listener.previousParams = params;
    }
    else {
      if (listener.active && listener.event === 'leave') {
        // Its a listener for 'leave' and the regexp matched on last check
        this._call(listener, listener.previousParams);
        listener.previousParams = null;
      }
      listener.active = false;
    }
  };

  Pather.prototype._checkAll = function () {
    for (var i = this.listeners.length; i--;) {
      this._check(this.listeners[i]);
    }
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = Pather;
    }
  } else {
    win.Pather = Pather;
  }
})(this, window);
