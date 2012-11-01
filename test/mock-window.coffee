global.window =
  location:
    pathname: "/"
  history:
    replaceState: (state, title, pathname)->
      window.location.pathname = pathname
      require("../path-listener").checkAll()