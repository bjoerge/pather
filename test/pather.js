var assert = require("assert");
var sinon = require("sinon");

var Pather = require("../pather");

describe("Pather", function () {
  var _originalPath;
  before(function() {
    _originalPath = window.location.href;
  });
  beforeEach(function () {
    window.location.hash = '';
    window.history.replaceState({}, null, "/");
  });

  describe("Pather", function () {
    var pather;
    var spy;
    beforeEach(function () {
      spy = sinon.spy();
      pather = new Pather();
    });
    afterEach(function () {
      pather.removeAllListeners();
    });

    describe("#on()", function (done) {
      it("should call its listener callback whenever a path matching the route is entered", function () {
        pather.on("/foo", spy);
        pather.navigate("/foo");
      });
      it("should ignore any trailing slash from the location path", function () {
        pather.on("/foo", spy);
        pather.navigate("/foo/");
        assert(spy.calledOnce);
      });
      it("should ignore any trailing slash from the route string too", function () {
        pather.on("/foo/", spy);
        pather.navigate("/foo")
        assert(spy.calledOnce);
      });
      it("can register a listener function for whenever a path is left", function () {
        pather.on("/foo", 'leave', spy);
        pather.navigate("/foo");
        pather.navigate("/bar");
        assert(spy.calledOnce);
      });
      it("can register a listener to be called when entering a parameterized route", function () {
        pather.on("/foo/:a/:b", spy);
        pather.navigate("/foo/bar/baz");
        assert(spy.calledOnce);
        assert.deepEqual(spy.firstCall.args.splice(1), ['bar', 'baz'])
      });
      it("should trigger on leave before enter", function () {
        var enterSpy = sinon.spy();
        var leaveSpy = sinon.spy();
        pather.navigate("/foo");
        pather.on("/*any", 'enter', enterSpy);
        pather.on("/*any", 'leave', leaveSpy);
        pather.navigate("/foo/bar");
        assert(leaveSpy.calledBefore(enterSpy));
      });
      it("should trigger on re-enter", function () {
        pather.on("/foo", spy);
        pather.navigate("/foo")
        assert(spy.calledOnce);
        pather.navigate("/bar")
        pather.navigate("/foo")
        assert(spy.calledTwice);
      });
      it("should trigger on re-leave", function () {
        pather.on("/foo", 'leave', spy);
        pather.navigate("/foo")
        assert(spy.notCalled);
        pather.navigate("/bar")
        assert(spy.calledOnce);
        pather.navigate("/baz")
        assert(spy.calledOnce);
        pather.navigate("/foo")
        assert(spy.calledOnce);
        pather.navigate("/baz")
        assert(spy.calledTwice);
      });
      it("should trigger on wildcard match", function () {
        pather.on("/foo/*", spy);
        pather.navigate("/foo");
        assert(spy.notCalled);
        pather.navigate("/foo/bar");
        assert(spy.calledOnce);
        pather.navigate("/foo/bar/baz");
        assert(spy.calledOnce);
      });
      it("should trigger leaving a wildcard match", function () {
        pather.on("/foo/*", 'leave', spy);
        pather.navigate("/foo/bar");
        pather.navigate("/foo/bar/baz");
        assert(spy.notCalled);
        pather.navigate("/foo");
        assert(spy.calledOnce);
      });
      it("can also specify params in the hash section of the location", function () {
        pather.on("/fruits/:fruit/#:bookmark", spy);
        pather.navigate("/fruits/banana/");
        assert(spy.notCalled);
        pather.navigate("/fruits/apple/#nutrition_facts");
        pather.navigate("/fruits/pear/#history");
        assert(spy.calledTwice);
      });
      it("should map the keyword parameters to the callback function", function () {
        pather.on("/foo/:a/:b?keyword=:c", spy);
        pather.navigate("/foo/bar/baz?keyword=qux");
        assert(spy.calledOnce);
        assert(spy.calledWith(sinon.match.object, 'bar', 'baz', 'qux'));
      });
    });

    describe("#once()", function () {
      it("should trigger only once", function () {
        pather.once("/foo", spy);
        pather.navigate("/foo")
        assert(spy.calledOnce);
        pather.navigate("/bar")
        pather.navigate("/foo")
        assert(spy.calledOnce);
      });
    });
  });

  describe("removing listeners", function () {
    var pather;
    var spy;
    beforeEach(function () {
      spy = sinon.spy();
      pather = new Pather();
    });
    it("should remove the listener", function () {
      pather.on("/foo", spy);
      pather.removeListener('/foo', spy);
      pather.navigate("/foo");
      assert(spy.notCalled);
    });
    it("should remove all listeners", function () {
      pather.on("/foo", 'enter', spy);
      pather.on("/foo", 'leave', spy);
      pather.on("/foo", 'enter', spy);
      pather.removeAllListeners();
      pather.navigate("/foo")
      assert(spy.notCalled);
    });
  });
  describe("matching route", function () {
    var pather;
    beforeEach(function () {
      pather = new Pather();
    });
    afterEach(function () {
      pather.removeAllListeners();
    });
    it("can check if there is a registered listener for a given route", function () {
      pather.on("/foo/bar", Function.prototype);

      assert(!pather.has("/foo"));

      pather.on("/foo/:bar", Function.prototype);

      assert(pather.has("/foo/baz"));
      assert(!pather.has("/fOo/Bar"));
    });

    it("can check whether the current location matches a regex", function () {

      pather.navigate("/foo")
      assert(pather.match(/foo.*/));
    });

    it("extracts the parameters from a regex", function () {
      pather.navigate("/foo/bar/baz")
      assert.deepEqual(['bar'], pather.match(/foo\/(.*)\/.*/));
    });

    it("can check whether the current location matches a route string", function () {
      pather.navigate("/foo/bar/baz")
      assert(pather.match("/foo/:qux/*"));
    });

    it("extracts the parameters from a route string", function () {
      pather.navigate("/foo/bar/baz")
      assert(pather.match("/foo/:qux/*subpath").params, ['bar', 'baz']);
    });

    it("extracts the named parameters from a route string", function () {
      pather.navigate("/foo/bar/baz/qux")
      assert.deepEqual(pather.match("/foo/*subpath/:qux").namedParams, {
        subpath: "bar/baz",
        qux: 'qux'
      });
    });

    it("extracts the query parameters from a route string", function () {
      pather.navigate("/foo/bar/baz?whatever=foobar");
      assert.deepEqual(pather.match("/foo/:qux/*subpath").queryParams, {
        whatever: "foobar"
      });
    });

  });

  describe("configuration", function () {
    var pather;

    pather = null;
    afterEach(function () {
      pather.removeAllListeners();
    });
    describe("Root path", function () {
      it("Can be configured with a root path", function () {
        var spy = sinon.spy();
        pather = new Pather({
          root: "/foo/bar"
        });
        pather.on("/baz", spy);
        pather.navigate("/foo/bar/baz")
        assert(spy.calledOnce);
      });
      it("Can be configured with a root path with a trailing slash", function () {
        var spy = sinon.spy();
        pather = new Pather({
          root: "/foo/bar/"
        });
        pather.on("/baz", spy);
        pather.navigate("/foo/bar/baz")
        assert(spy.calledOnce);
      });
    });
  });
  after(function() {
    window.history.replaceState({}, null, _originalPath);
  })
});