require("./mock-window")
Pather = require("../pather")
sinon = require("sinon")

describe "Path listener", ->

  describe "Path matching", ->
    pather = null
    beforeEach ->
      pather = new Pather()
      window.location.hash = ''
      window.history.replaceState {}, null, "/"
    afterEach ->
      pather.removeAllListeners()

    it "can register a listener function for whenever a path is entered", ->
      spy = sinon.spy()
      pather.on "/foo", spy
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1

    it "can register a listener function for whenever a path is left", ->
      spy = sinon.spy()
      pather.on "/foo", 'leave', spy
      window.history.replaceState {}, null, "/foo"
      window.history.replaceState {}, null, "/bar"
      spy.callCount.should.equal 1

    it "can register a listener to be called when entering a parameterized route", ->
      spy = sinon.spy()
      pather.on "/foo/:a/:b", spy
      window.history.replaceState {}, null, "/foo/bar/baz"
      spy.callCount.should.equal 1
      spy.calledWith('bar', 'baz').should.be.ok

    it "will trigger on re-enter", ->
      spy = sinon.spy()
      pather.on "/foo", spy
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1
      window.history.replaceState {}, null, "/bar"
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 2

    it "will trigger only once if listener added with #once", ->
      spy = sinon.spy()
      pather.once "/foo", spy
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1
      window.history.replaceState {}, null, "/bar"
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1

    it "will trigger on re-leave", ->
      spy = sinon.spy()
      pather.on "/foo", 'leave', spy
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
      pather.on "/foo/*", spy
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 0
      window.history.replaceState {}, null, "/foo/bar"
      spy.callCount.should.equal 1
      window.history.replaceState {}, null, "/foo/bar/baz"
      spy.callCount.should.equal 1

    it "will trigger leaving a wildcard match", ->
      spy = sinon.spy()
      pather.on "/foo/*", 'leave', spy
      window.history.replaceState {}, null, "/foo/bar"
      window.history.replaceState {}, null, "/foo/bar/baz"
      spy.callCount.should.equal 0
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 1

    it "can also specify params in the hash section of the location", ->
      spy = sinon.spy()
      pather.on "/fruits/:fruit/#:bookmark", spy
      window.history.replaceState({}, null, "/fruits/banana/")
      spy.called.should.equal false
      window.location.hash = "nutrition_facts"
      window.location.hash = "history"
      spy.callCount.should.equal 2

    xit "will also map the keyword parameters to the callback function (todo)", ->
      spy = sinon.spy()
      pather.on "/foo/:a/:b?keyword=:c", spy
      window.history.replaceState {}, null, "/foo/bar/baz?keyword=qux"
      spy.callCount.should.equal 1
      spy.calledWith('bar', 'baz', {keyword: 'qux'}).should.be.ok

  describe "removing listeners", ->
    pather = null
    beforeEach ->
      pather = new Pather()
      window.location.hash = ''
      window.history.replaceState {}, null, "/"
    afterEach ->
      pather.removeAllListeners()

    it "can remove a listener", ->
      spy = sinon.spy()
      pather.on "/foo", spy
      pather.removeListener('/foo', spy)
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 0

    it "can remove all listeners", ->
      spy = sinon.spy()
      pather.on "/foo", 'enter', spy
      pather.on "/foo", 'leave', spy
      pather.on "/foo", 'enter', spy
      pather.removeAllListeners()
      window.history.replaceState {}, null, "/foo"
      spy.callCount.should.equal 0

  describe "matching route", ->
    pather = null
    beforeEach ->
      pather = new Pather()
      window.location.hash = ''
      window.history.replaceState {}, null, "/"
    afterEach ->
      pather.removeAllListeners()

    it "can check if there is a registered listener for a given route", ->
      pather.on "/foo/bar", ->
      pather.has("/foo").should.not.be.ok

      pather.on "/foo/:bar", ->
      pather.has("/foo/baz").should.be.ok

      pather.has("/fOo/Bar").should.not.be.ok
      pather.on /foo\/bar/i, ->
      pather.has("/fOo/Bar").should.be.ok

    it "can check whether the current location matches a regex", ->
      window.history.replaceState {}, null, "/foo"
      pather.match(/foo.*/).should.be.ok

    it "extracts the parameters from a regex", ->
      window.history.replaceState {}, null, "/foo/bar/baz"
      pather.match(/foo\/(.*)\/.*/).should.eql ['bar']

    it "can check whether the current location matches a route string", ->
      window.history.replaceState {}, null, "/foo/bar/baz"
      pather.match("/foo/:qux/*").should.be.ok

    it "extracts the parameters from a route string", ->
      window.history.replaceState {}, null, "/foo/bar/baz"
      pather.match("/foo/:qux/*subpath").should.eql ['bar', 'baz']


  describe "configuration", ->
    pather = null
    beforeEach ->
      pather = new Pather()
      window.location.hash = ''
      window.history.replaceState {}, null, "/"
    afterEach ->
      pather.removeAllListeners()
  
    it "can check if there is a registered listener for a given route", ->
      pather.on "/foo/bar", ->
      pather.has("/foo").should.not.be.ok

      pather.on "/foo/:bar", ->
      pather.has("/foo/baz").should.be.ok

      pather.has("/fOo/Bar").should.not.be.ok
      pather.on /foo\/bar/i, ->
      pather.has("/fOo/Bar").should.be.ok

    it "can check whether the current location matches a regex", ->
      window.history.replaceState {}, null, "/foo"
      pather.match(/foo.*/).should.be.ok

    it "extracts the parameters from a regex", ->
      window.history.replaceState {}, null, "/foo/bar/baz"
      pather.match(/foo\/(.*)\/.*/).should.eql ['bar']

    it "can check whether the current location matches a route string", ->
      window.history.replaceState {}, null, "/foo/bar/baz"
      pather.match("/foo/:qux/*").should.be.ok

    it "extracts the parameters from a route string", ->
      window.history.replaceState {}, null, "/foo/bar/baz"
      pather.match("/foo/:qux/*subpath").should.eql ['bar', 'baz']

