require("./mock-window")
Pather = require("../pather")
sinon = require("sinon")

describe "Path listener", ->
  beforeEach ->
    window.location.hash = ''
    window.history.replaceState {}, null, "/"
  afterEach ->
    Pather.removeAllListeners()

  describe "Path matching", ->

    it "can register a listener function for whenever a path is entered", ->
      spy = sinon.spy()
      Pather.on "/foo", spy
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1

    it "can register a listener function for whenever a path is left", ->
      spy = sinon.spy()
      Pather.on "/foo", 'leave', spy
      window.history.replaceState {}, null, "/foo"
      window.history.replaceState {}, null, "/bar"
      spy.callCount.should.equal 1

    it "can register a listener to be called when entering a parameterized route", ->
      spy = sinon.spy()
      Pather.on "/foo/:a/:b", spy
      window.history.replaceState {}, null, "/foo/bar/baz"
      spy.callCount.should.equal 1
      spy.calledWith('bar', 'baz').should.be.ok

    it "will trigger on re-enter", ->
      spy = sinon.spy()
      Pather.on "/foo", spy
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1
      window.history.replaceState {}, null, "/bar"
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 2

    it "will trigger only once if listener added with #once", ->
      spy = sinon.spy()
      Pather.once "/foo", spy
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1
      window.history.replaceState {}, null, "/bar"
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1

    it "will trigger on re-leave", ->
      spy = sinon.spy()
      Pather.on "/foo", 'leave', spy
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
      Pather.on "/foo/*", spy
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 0
      window.history.replaceState {}, null, "/foo/bar"
      spy.callCount.should.equal 1
      window.history.replaceState {}, null, "/foo/bar/baz"
      spy.callCount.should.equal 1

    it "will trigger leaving a wildcard match", ->
      spy = sinon.spy()
      Pather.on "/foo/*", 'leave', spy
      window.history.replaceState {}, null, "/foo/bar"
      window.history.replaceState {}, null, "/foo/bar/baz"
      spy.callCount.should.equal 0
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1

    it "can also specify params in the hash section of the location", ->
      spy = sinon.spy()
      Pather.on "/fruits/:fruit/#:bookmark", spy
      window.history.replaceState({}, null, "/fruits/banana/")
      spy.called.should.equal false
      window.location.hash = "nutrition_facts"
      window.location.hash = "history"
      spy.callCount.should.equal 2

    xit "will also map the keyword parameters to the callback function (todo)", ->
      spy = sinon.spy()
      Pather.on "/foo/:a/:b?keyword=:c", spy
      window.history.replaceState {}, null, "/foo/bar/baz?keyword=qux"
      spy.callCount.should.equal 1
      spy.calledWith('bar', 'baz', {keyword: 'qux'}).should.be.ok

  describe "removing listeners", ->
    it "can remove a listener", ->
      spy = sinon.spy()
      Pather.on "/foo", spy
      Pather.removeListener('/foo', spy)
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 0

    it "can remove all listeners", ->
      spy = sinon.spy()
      Pather.on "/foo", 'enter', spy
      Pather.on "/foo", 'leave', spy
      Pather.on "/foo", 'enter', spy
      Pather.removeAllListeners()
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 0

  describe "matching route", ->
    it "can check if there is a registered listener for a given route", ->
      Pather.on "/foo/bar", ->
      Pather.has("/foo").should.not.be.ok

      Pather.on "/foo/:bar", ->
      Pather.has("/foo/baz").should.be.ok

      Pather.has("/fOo/Bar").should.not.be.ok
      Pather.on /foo\/bar/i, ->
      Pather.has("/fOo/Bar").should.be.ok

    it "can check whether the current location matches a regex", ->
      window.history.replaceState {}, null, "/foo"
      Pather.match(/foo.*/).should.be.ok

    it "extracts the parameters from a regex", ->
      window.history.replaceState {}, null, "/foo/bar/baz"
      Pather.match(/foo\/(.*)\/.*/).should.eql ['bar']

    it "can check whether the current location matches a route string", ->
      window.history.replaceState {}, null, "/foo/bar/baz"
      Pather.match("/foo/:qux/*").should.be.ok

    it "extracts the parameters from a route string", ->
      window.history.replaceState {}, null, "/foo/bar/baz"
      Pather.match("/foo/:qux/*subpath").should.eql ['bar', 'baz']

