const routes = require('./routes.js');

module.exports = {
    register_routes
}

function register_routes(app) {
    app.get('/', routes.get_helloworld);
    app.post('/register', routes.post_register);
    app.post('/login', routes.post_login);
    app.post('/:username/createPost', posts.create_post); 
}