const routes = require('./routes.js');

module.exports = {
    register_routes
}

function register_routes(app) {
    app.get('/hello', routes.get_helloworld);
  }
  