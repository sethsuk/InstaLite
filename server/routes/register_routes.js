const account = require('./account.js');
const friends = require('./friends.js');
const pfp = require('./pfp.js');
const posts = require('./posts.js');
const registration = require('./registration.js');

module.exports = {
    register_routes
}

function register_routes(app) {
    app.get('/', account.get_helloworld);
    app.post('/signup', registration.signup);
    app.post('/login', registration.login);
}