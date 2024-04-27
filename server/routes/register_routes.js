const account = require('./account.js');
const friends = require('./friends.js');
const pfp = require('./pfp.js');
const posts = require('./posts.js');
const registration = require('./registration.js');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

module.exports = {
    register_routes
}

function register_routes(app) {
    app.get('/', account.get_helloworld);
    app.post('/:username/changeEmail', account.change_email);
    app.post('/:username/changePassword', account.change_password);
    app.post('/:username/changeAffiliation', account.change_affiliation);
    app.post('/:username/suggestHashtags', account.suggest_hashtags);
    app.post('/:username/updateHashtags', account.update_hashtags);
    app.post('/:username/removeHashtags', account.remove_hashtags);
    app.post('/:username/updatePfp', account.update_pfp);

    app.post('/addHashtags', registration.add_hashtags);
    app.post('/signup', registration.signup); // with s3 it should be app.post('/signup', upload.single('image'), registration.signup);
    app.post('/login', registration.login);
    app.get('/getTop10Hashtags', registration.get_top_10_hashtags);
    app.post('/:username/logout', registration.logout);

    app.get('/:username/getTop5Actors', pfp.get_top_5_actors);
    app.post('/:username/associateActor', pfp.associate_actor);
    app.get('/:username/getActorInfo', pfp.get_actor_info);
    app.get('/:username/getPfp', pfp.get_pfp);

    app.post('/:username/sendFriendRequest', friends.send_friend_request);
    app.get('/:username/getFriendRequests', friends.get_friend_requests);
    app.post('/:username/acceptFriendRequest', friends.accept_friend_request);
    app.post('/:username/rejectFriendRequest', friends.reject_friend_request);
    app.get('/:username/getFriends', friends.get_friends);
    app.post('/:username/removeFriend', friends.remove_friend);
}