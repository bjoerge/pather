// Universal Module Loader (Based on https://gist.github.com/wilmoore/3880415)
!(function (name, context, definition) {
  if (typeof exports == 'object') {
    module.exports = definition(require);
  } else if (typeof define == 'function' && define.amd) {
    define(definition);
  } else if (typeof YUI == "function") {
    YUI.add(name, definition, '@VERSION@', {requires: []});
  } else {
    context[name] = definition();
  }
}).call(this, 'Pather', this, function (require) {

require=(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{"./pather.js":[function(require,module,exports){
module.exports=require('5ztE8l');
},{}],"5ztE8l":[function(require,module,exports){
(function (root, win) {
  "use strict";

  // Cross browser addEventListener
  var addDOMListener = function (type, listener, useCapture) {
      addDOMListener = window[window.addEventListener ? 'addEventListener' : 'attachEvent'].bind(window);
      return addDOMListener(type, listener, useCapture);
    },

  // Compare two objects recursively for equality
  // Note that this a rather naïve deepEqual implementation.
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

},{"route-pattern":1}],1:[function(require,module,exports){
var merge = function() {
  return [].slice.call(arguments).reduce(function(merged, source) {
    for (var prop in source) {
      merged[prop] = source[prop];
    }
    return merged;
  }, {});
};

var decodeQueryString = function(queryString) {
  return queryString.split("&").reduce(function (params, pair) {
    var parts = pair.split("="),
      key = decodeURIComponent(parts[0]),
      value = decodeURIComponent(parts[1] || '');
    params[key] = value;
    return params;
  }, {});
};

var parseLocation = function(location) {
  var re = /([^\?#]*)?(\?[^#]*)?(#.*)?$/;
  var match = re.exec(location);
  return {
    path: match[1] || '',
    queryString: match[2] && match[2].substring(1) || '',
    hash: match[3] && match[3].substring(1) || ''
  }
};

var QueryStringPattern = (function () {

  // The RoutePattern constructor
  // Takes a route string or regexp as parameter and provides a set of utility functions for matching against a 
  // location path
  function QueryStringPattern(options) {

    // The query parameters specified
    this.params = options.params;

    // if allowWildcards is set to true, unmatched query parameters will be ignored
    this.allowWildcards = options.allowWildcards;

    // The original route string (optional)
    this.routeString = options.routeString;
  }

  QueryStringPattern.prototype.matches = function (queryString) {
    var givenParams = (queryString || '').split("&").reduce(function (params, pair) {
      var parts = pair.split("="),
        name = parts[0],
        value = parts[1];
      if (name) params[name] = value;
      return params;
    }, {});

    var requiredParam, requiredParams = [].concat(this.params);
    while (requiredParam = requiredParams.shift()) {
      if (!givenParams.hasOwnProperty(requiredParam.key)) return false;
      if (requiredParam.value && givenParams[requiredParam.key] != requiredParam.value) return false;
    }
    if (!this.allowWildcards && this.params.length) {
      if (Object.getOwnPropertyNames(givenParams).length > this.params.length) return false;
    }
    return true;
  };

  QueryStringPattern.prototype.match = function (queryString) {
    var data = {
      params: [],
      namedParams: {},
      namedQueryParams: {},
      queryParams: {}
    };

    if (!queryString) {
      return data;
    }

    // Create a mapping from each key in params to their named param
    var namedParams = this.params.reduce(function (names, param) {
      names[param.key] = param.name;
      return names;
    }, {});

    queryString.split("&").forEach(function (pair) {
      var parts = pair.split("="),
        key = decodeURIComponent(parts[0]),
        value = decodeURIComponent(parts[1] || '');
      data.queryParams[key] = value;

      data.params.push(value);
      if (namedParams[key]) {
        data.namedQueryParams[namedParams[key]] = data.namedParams[namedParams[key]] = value;
      }
    });
    return data;
  };
  QueryStringPattern.fromString = function (routeString) {

    var options = {
      routeString: routeString,
      allowWildcards: false,
      params: []
    };

    // Extract named parameters from the route string
    // Construct an array with some metadata about each of the named parameters
    routeString.split("&").forEach(function (pair) {
      if (!pair) return;

      var parts = pair.split("="),
        name = parts[0],
        value = parts[1] || '';

      var wildcard = false;

      var param = { key: name };

      // Named parameters starts with ":"
      if (value.charAt(0) == ':') {
        // Thus the name of the parameter is whatever comes after ":"
        param.name = value.substring(1);
      }
      else if (name == '*' && value == '') {
        // If current param is a wildcard parameter, the options are flagged as accepting wildcards
        // and the current parameter is not added to the options' list of params
        wildcard = options.allowWildcards = true;
      }
      else {
        // The value is an exact match, i.e. the route string 
        // page=search&q=:query will match only when the page parameter is "search"
        param.value = value;
      }
      if (!wildcard) {
        options.params.push(param);
      }
    });
    return new QueryStringPattern(options);
  };

  return QueryStringPattern;
})();


// # RoutePattern
// The RoutePattern holds a compiled version of a route string
var PathPattern = (function () {

  // These are the regexps used to construct a regular expression from a route pattern string
  // Almost entirely taken from Backbone.js
  var
    pathParam = /:\w+/g,
    splatParam = /\*\w+/g,
    namedParams = /(:[^\/\.]+)|(\*\w+)/g,
    subPath = /\*/g,
    escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g;

  // The PathPattern constructor
  // Takes a route string or regexp as parameter and provides a set of utility functions for matching against a 
  // location path
  function PathPattern(options) {
    // The route string are compiled to a regexp (if it isn't already)
    this.regexp = options.regexp;

    // The query parameters specified in the path part of the route
    this.params = options.params;

    // The original routestring (optional)
    this.routeString = options.routeString;
  }

  PathPattern.prototype.matches = function (pathname) {
    return this.regexp.test(pathname);
  };

  // Extracts all matched parameters
  PathPattern.prototype.match = function (pathname) {

    // The captured data from pathname
    var data = {
      params: [],
      namedParams: {}
    };

    // Using a regexp to capture named parameters on the pathname (the order of the parameters is significant)
    (this.regexp.exec(pathname) || []).slice(1).forEach(function (value, idx) {
      value = decodeURIComponent(value);
      data.namedParams[this.params[idx]] = value;
      data.params.push(value);
    }, this);

    return data;
  };

  PathPattern.routePathToRegexp = function(path) {
    path = path
      .replace(escapeRegExp, "\\$&")
      .replace(pathParam, "([^/]+)")
      .replace(splatParam, "(.*)?")
      .replace(subPath, ".*?")
      .replace(/\/?$/, "/?");
    return new RegExp("^/?" + path + "$");
  };

  // This compiles a route string into a set of options which a new PathPattern is created with 
  PathPattern.fromString = function (routeString) {

    // Whatever comes after ? and # is ignored
    routeString = routeString.split(/\?|#/)[0];

    // Create the options object
    // Keep the original routeString and a create a regexp for the pathname part of the url
    var options = {
      routeString: routeString,
      regexp: PathPattern.routePathToRegexp(routeString),
      params: (routeString.match(namedParams) || []).map(function (param) {
        return param.substring(1);
      })
    };

    // Options object are created, now instantiate the PathPattern
    return new PathPattern(options);
  };

  return PathPattern;
}());

// # RoutePattern
// The RoutePattern holds a compiled version of a route string
var RoutePattern = module.exports = (function () {

  // The RoutePattern constructor
  // Takes a route string or regexp as parameter and provides a set of utility functions for matching against a 
  // location path
  function RoutePattern(options) {
    // The route string are compiled to a regexp (if it isn't already)
    this.pathPattern = options.pathPattern;
    this.queryStringPattern = options.queryStringPattern;
    this.hashPattern = options.hashPattern;

    // The original routestring (optional)
    this.routeString = options.routeString;
  }

  RoutePattern.prototype.matches = function (location) {
    // Whatever comes after ? and # is ignored
    var loc = parseLocation(location);

    return (!this.pathPattern || this.pathPattern.matches(loc.path)) &&
      (!this.queryStringPattern || this.queryStringPattern.matches(loc.queryString) ) &&
      (!this.hashPattern || this.hashPattern.matches(loc.hash))
  };

  // Extracts all matched parameters
  RoutePattern.prototype.match = function (location) {

    // Whatever comes after ? and # is ignored
    var loc = parseLocation(location),
      match,
      pattern;

    var data = {
      params: [],
      namedParams: {},
      pathParams: {},
      queryParams: {},
      namedQueryParams: {},
      hashParams: {}
    };

    var addMatch = function(match) {
      data.params = data.params.concat(match.params);
      data.namedParams = merge(data.namedParams, match.namedParams);
    };

    if (pattern = this.pathPattern) {
      match = pattern.match(loc.path);
      if (match) addMatch(match);
      data.pathParams = match ? match.namedParams : {};
    }
    if (pattern = this.queryStringPattern) {
      match = pattern.match(loc.queryString);
      if (match) addMatch(match);
      data.queryParams = match ? match.queryParams : {};
      data.namedQueryParams = match ? match.namedQueryParams : {};
    }
    if (pattern = this.hashPattern) {
      match = pattern.match(loc.hash);
      if (match) addMatch(match);
      data.hashParams = match ? match.namedParams : {};
    }
    return data;
  };

  // This compiles a route string into a set of options which a new RoutePattern is created with 
  RoutePattern.fromString = function (routeString) {
    var parts = parseLocation(routeString);

    var matchPath = parts.path;
    var matchQueryString = parts.queryString || routeString.indexOf("?") > -1;
    var matchHash =  parts.hash || routeString.indexOf("#") > -1;

    // Options object are created, now instantiate the RoutePattern
    return new RoutePattern({
      pathPattern: matchPath && PathPattern.fromString(parts.path),
      queryStringPattern: matchQueryString && QueryStringPattern.fromString(parts.queryString),
      hashPattern: matchHash && PathPattern.fromString(parts.hash),
      routeString: routeString
    });
  };

  return RoutePattern;
}());

// # RegexPattern
// The RegexPattern matches against a regex
var RegexPattern = (function () {

  // The RegexPattern constructor
  // Wraps a regexp and provides a *Pattern api for it
  function RegexPattern(regex) {
    this.regex = regex;
  }

  RegexPattern.prototype.matches = function (loc) {
    return this.regex.test(loc);
  };

  // Extracts all matched parameters
  RegexPattern.prototype.match = function (loc) {
    var queryString = loc.search || loc.split("?")[0] || '';
    var queryParams = decodeQueryString(queryString);
    return {
      params: this.regex.exec(loc).slice(1),
      namedParams: {},
      queryParams: queryParams
    };
  };

  return RegexPattern;
}());

},{}]},{},["5ztE8l"])
;
return require("./pather.js");
});