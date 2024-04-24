const account_routes = require("./account");
const friend_routes = require("./friends");
const registration_routes = require("./registration");

const routes = {
    login: registration_routes.login,
    logout: registration_routes.logout,
    signup: registration_routes.signup,
    get_top_10_hashtags: registration_routes.get_top_10_hashtags,
    change_email: account_routes.change_email,
    change_password: account_routes.change_password,
    change_affiliation: account_routes.change_affiliation,
    add_hashtag: account_routes.add_hashtag,
    remove_hashtag: account_routes.remove_hashtag,
    change_actor: account_routes.change_actor,
    send_friend_request: friend_routes.send_friend_request,
    get_friend_requests: friend_routes.get_friend_requests,
    accept_friend_request: friend_routes.accept_friend_request,
    reject_friend_request: friend_routes.reject_friend_request,
    get_friends: friend_routes.get_friends,
    remove_friend: friend_routes.remove_friend,






};

module.exports = routes; 
