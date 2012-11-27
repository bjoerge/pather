require("./mock-window")
Path = require("../pather")
sinon = require("sinon")

describe "Path listener", ->
  beforeEach ->
    window.history.replaceState {}, null, "/"
  afterEach ->
    Path.removeAllListeners()

  describe "Path matching", ->

    it "can register a listener function for whenever a path is entered", ->
      spy = sinon.spy()
      Path.on "/foo", spy
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1

    it "can register a listener function for whenever a path is left", ->
      spy = sinon.spy()
      Path.on "/foo", 'leave', spy
      window.history.replaceState {}, null, "/foo"
      window.history.replaceState {}, null, "/bar"
      spy.callCount.should.equal 1

    it "can register a listener to be called when entering a parameterized route", ->
      spy = sinon.spy()
      Path.on "/foo/:a/:b", spy
      window.history.replaceState {}, null, "/foo/bar/baz"
      spy.callCount.should.equal 1
      spy.calledWith('bar', 'baz').should.be.ok

    it "will trigger on re-enter", ->
      spy = sinon.spy()
      Path.on "/foo", spy
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1
      window.history.replaceState {}, null, "/bar"
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 2

    it "will trigger only once if listener added with #once", ->
      spy = sinon.spy()
      Path.once "/foo", spy
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1
      window.history.replaceState {}, null, "/bar"
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1

    it "will trigger on re-leave", ->
      spy = sinon.spy()
      Path.on "/foo", 'leave', spy
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 0
      window.history.replaceState {}, null, "/bar"
      spy.callCount.should.equal 1
      window.history.replaceState {}, null, "/baz"
      spy.callCount.should.equal 1
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1
      window.history.replaceState {}, null, "/baz"
      spy.callCount.should.equal 2

    it "will trigger on wildcard match", ->
      spy = sinon.spy()
      Path.on "/foo/*", spy
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 0
      window.history.replaceState {}, null, "/foo/bar"
      spy.callCount.should.equal 1
      window.history.replaceState {}, null, "/foo/bar/baz"
      spy.callCount.should.equal 1

    it "will trigger leaving a wildcard match", ->
      spy = sinon.spy()
      Path.on "/foo/*", 'leave', spy
      window.history.replaceState {}, null, "/foo/bar"
      window.history.replaceState {}, null, "/foo/bar/baz"
      spy.callCount.should.equal 0
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1

    xit "will also map the keyword parameters to the callback function (todo)", ->
      spy = sinon.spy()
      Path.on "/foo/:a/:b?keyword=:c", spy
      window.history.replaceState {}, null, "/foo/bar/baz?keyword=qux"
      spy.callCount.should.equal 1
      spy.calledWith('bar', 'baz', {keyword: 'qux'}).should.be.ok

  describe "removing listeners", ->
    it "can remove a listener", ->
      spy = sinon.spy()
      Path.on "/foo", spy
      Path.removeListener('/foo', spy)
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 0

    it "can remove all listeners", ->
      spy = sinon.spy()
      Path.on "/foo", 'enter', spy
      Path.on "/foo", 'leave', spy
      Path.on "/foo", 'enter', spy
      Path.removeAllListeners()
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 0

  describe "matching route", ->
    it "can check if there is a registered listener for a given route", ->
      Path.on "/foo/bar", ->
      Path.has("/foo").should.not.be.ok

      Path.on "/foo/:bar", ->
      Path.has("/foo/baz").should.be.ok

      Path.has("/fOo/Bar").should.not.be.ok
      Path.on /foo\/bar/i, ->
      Path.has("/fOo/Bar").should.be.ok

    it "can check whether the current location matches a regex", ->
      window.history.replaceState {}, null, "/foo"
      Path.match(/foo.*/).should.be.ok

    it "extracts the parameters from a regex", ->
      window.history.replaceState {}, null, "/foo/bar/baz"
      Path.match(/foo\/(.*)\/.*/).should.eql ['bar']

    it "can check whether the current location matches a route string", ->
      window.history.replaceState {}, null, "/foo/bar/baz"
      Path.match("/foo/:qux/*").should.be.ok

    it "extracts the parameters from a route string", ->
      window.history.replaceState {}, null, "/foo/bar/baz"
      Path.match("/foo/:qux/*subpath").should.eql ['bar', 'baz']

