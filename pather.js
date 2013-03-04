(function(root, win) {

  // Recklessly stolen from Backbone.js and modified a little
  var namedParam = /:\w+/g,
      splatParam = /\*\w+/g,
      subPath = /\*/g,
      escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g,
      routeToRegExp = function (route) {
        route = route.replace(escapeRegExp, "\\$&").replace(namedParam, "([^/]+)").replace(splatParam, "(.*)?").replace(subPath, ".*?");
        return new RegExp("^" + route + "$");
      },
      normalizePathname = function() {
        var loc = window.location;
        var pathname = loc.pathname + loc.hash;
        return pathname || "/";
      };

  var Pather = (function () {
    var addDOMListener = function(type, listener, useCapture) {
      addDOMListener = window[window.addEventListener ? 'addEventListener' : 'attachEvent'].bind(window);
      return addDOMListener(type, listener, useCapture);
    };

    var listeners = [];

    function find(listener) {
      for (var i = listeners.length; i--;) {
        var l = listeners[i];
        if (l.route === listener.route && l.event === listener.event && l.handler === listener.handler) {
          return l;
        }
      }
      return null;
    }

    function remove(listener) {
      var idx = listeners.indexOf(listener);
      if (idx > -1) {
        listeners.splice(idx, 1);
      }
    }

    function call(listener, params) {
      listener.handler.apply(listener, params);
      if (listener.once) {
        remove(listener);
      }
    }

    function deepEqual(a1, a2) {
      return JSON.stringify(a1) == JSON.stringify(a2);
    }

    function check(listener, path) {
      if (listener.regexp.test(path)) {
        var params = listener.regexp.exec(path).slice(1);
        if (listener.event === 'enter' && !(listener.active && deepEqual(listener.prevParams, params))) {
          // Its a listener for 'enter' and wasn't active on last check, so call the listener function
          call(listener, params);
        }
        // Store for next check
        listener.active = true;
        listener.prevParams = params;
      }
      else {
        if (listener.hasOwnProperty('prevParams') && listener.event === 'leave') {
          // Its a listener for 'leave' and the regexp matched on last check
          call(listener, listener.prevParams);
          delete listener.prevParams;
        }
        listener.active = false;
      }
    }

    /**
     *  A decorator that turns any given funciton into a function that will be called with a listener object
     *  built from the original params
     */
    function withListener(func) {
      return function (route, event, handler) {
        if (arguments.length === 2) {
          handler = event;
          event = 'enter';
        }
        var listener = {
          route: route,
          event: event,
          handler: handler,
          regexp: (route instanceof RegExp) ? route : routeToRegExp(route)
        };
        return func.call(this, listener);
      };
    }

    function Pather(config) {
      config || (config = {});

      if (!(config.hasOwnProperty('pushState') || config.pushState === false)) {
        addDOMListener('popstate', this.checkAll.bind(this))
      }
      if (!(config.hasOwnProperty('hash') || config.hash === false)) {
        addDOMListener('hashchange', this.checkAll.bind(this))
      }
    }

    Pather.prototype.on = withListener(function (listener) {
      listeners.push(listener);
      check(listener, normalizePathname());
    });

    Pather.prototype.once = withListener(function (listener) {
      listener.once = true;
      listeners.push(listener);
      check(listener, normalizePathname());
    });

    Pather.prototype.removeListener = withListener(function (listener) {
      remove(find(listener));
    });

    Pather.prototype.removeAllListeners = function () {
      listeners = [];
    };

    /**
     * Convenience method to check if the given regex or route string matches the current document.location.pathname
     * @param route
     * @returns true or false
     */
    Pather.prototype.matches = function (/* String|RegExp */ route) {
      return !!this.match(route);
    };

    /**
     * Match the given regex or route string against the current document.location.pathname and return an array with the
     * values for each capturing parenthesis. Returns null if there is no match.
     * @param route
     * @returns the values for captured parenthesis
     */
    Pather.prototype.match = function (/* String|RegExp */ route) {
      var regexp = (route instanceof RegExp) ? route : routeToRegExp(route);
      var matches = regexp.exec(normalizePathname());
      return matches && matches.slice(1);
    };

    /**
     * Checks whether any of the registered listeners matches the given path
     * @param pathname
     */
    Pather.prototype.has = function (pathname) {
      return listeners.some(function(listener) {
        return listener.regexp.test(pathname);
      });
    };

    Pather.prototype.checkAll = function () {
      listeners.forEach(function (listener) {
        check(listener, normalizePathname());
      });
    };

    return Pather;

  })();

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = Pather;
    }
  } else {
    win.Pather = Pather;
  }

})(this, window);
