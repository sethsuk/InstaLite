const account = require('./account.js');
const friends = require('./friends.js');
const pfp = require('./pfp.js');
const posts = require('./posts.js');
const registration = require('./registration.js');
const comments = require('./comments.js');
const home = require('./home.js');
const chat = require('./chat.js');
const search = require('./search.js')

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

module.exports = {
    register_routes
}

function register_routes(app) {
    app.get('/', account.get_helloworld);
    app.post('/:username/changeEmail', account.change_email); // verified
    app.post('/:username/changePassword', account.change_password); // verified
    app.post('/:username/changeAffiliation', account.change_affiliation); // verified
    app.post('/:username/suggestHashtags', account.suggest_hashtags); // verified
    app.post('/:username/updateHashtags', account.update_hashtags); // verified
    app.post('/:username/removeHashtags', account.remove_hashtags); // verified
    app.post('/:username/updatePfp', upload.single('file'), account.update_pfp); // verified
    app.get('/:username/getHashtags', account.get_hashtags); // verified

    app.post('/addHashtags', registration.add_hashtags); // verified
    app.post('/signup', upload.single('file'), registration.signup); // verified
    app.post('/login', registration.login); // verified
    app.get('/getTop10Hashtags', registration.get_top_10_hashtags); // verified
    app.post('/:username/logout', registration.logout); // verified

    app.get('/:username/getTop5Actors', pfp.get_top_5_actors); // verified
    app.post('/:username/associateActor', pfp.associate_actor); // verified
    app.get('/:username/getActorInfo', pfp.get_actor_info); // verified
    app.get('/:username/getPfp', pfp.get_pfp); // verified

    app.post('/:username/sendFriendRequest', friends.send_friend_request); // verified
    app.get('/:username/getFriendRequests', friends.get_friend_requests); // verified
    app.post('/:username/acceptFriendRequest', friends.accept_friend_request); // verified
    app.post('/:username/rejectFriendRequest', friends.reject_friend_request); // verified
    app.get('/:username/getFriends', friends.get_friends); // verified
    app.post('/:username/removeFriend', friends.remove_friend); // verified

    app.post('/:username/createPost', upload.single('file'), posts.create_post); // verified
    app.post('/:username/likePost', posts.like_post); // verified
    app.post('/:username/unlikePost', posts.unlike_post) // verified
    app.post('/:username/getPostMedia', posts.get_post_media); // verified
    app.post('/:username/getSinglePost', posts.get_single_post); // verified

    app.post('/:username/createComment', comments.create_comment); // verified
    app.post('/:username/getComments', comments.get_comments); // verified

    app.get('/:username/getPosts', home.get_posts); // verified
    app.get('/:username/getNotifications', home.get_notifications); // verified

    app.get('/:username/authenticateChat', chat.authenticate_chat); 
    app.get('/:username/onlineFriends', chat.get_online_friends); 
    app.get('/:username/inviteToChat', chat.invite_to_chat); 
    app.get('/:username/getChats', chat.get_chats); 
    app.get('/:username/getChatInvites', chat.get_chat_invitations); 
    app.post('/:username/acceptInvite', chat.accept_invite); 
    app.post('/:username/rejectInvite', chat.reject_invite); 
    app.get('/:username/getInvitableFriends', chat.get_invitable_friends); 
    app.post('/:username/sendInvite', chat.send_invite); 
    app.get('/:username/invitableToChat', chat.invitable_to_chat); 
    app.get('/:username/leaveChat', chat.leave_chat); 

    app.get('/query', search.query);
    // ------------

    app.post('/dummyS3Upload', upload.single('file'), registration.dummy_s3_upload);
}