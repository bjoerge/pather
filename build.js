var fs = require("fs");
var pkg = require("./package.json");
var browserify = require('browserify');

var bundle = browserify(["./pather.js"]);
bundle.require("./pather.js");

var target = pkg.name + "-" + pkg.version + ".js";

bundle.bundle({}, function (err, src) {
  var wrapped = [fs.readFileSync("./extra/umd-prelude.js"), src, fs.readFileSync("./extra/umd-postlude.js")].join("\n");
  fs.writeFileSync(target, wrapped);
  console.log('Built version %s to %s', pkg.version, target);
  // Todo: uglify
});
