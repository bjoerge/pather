var connect = require('connect');

connect()
  .use(connect.directory(__dirname), { icons: true })
  .use(connect.static(__dirname))
  .listen(3000, '0.0.0.0');