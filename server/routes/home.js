var db = require('../models/database.js');
const config = require('../../config.json'); // Load configuration
const helper = require('./route_helper.js');
const chromadb = require('../models/chroma.js');

// GET /getPosts
var getPosts = async function (req, res) {
    if (!helper.isLoggedIn(req, req.params.username)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    try {
        var results = await db.send_sql(`
            SELECT DISTINCT p.post_id, p.title, p.media, p.content, p.likes, p.timestamp,
                            u.user_id, u.username, u.pfp_url, 
                            GROUP_CONCAT(DISTINCT CONCAT('#', h.tag) ORDER BY h.tag ASC SEPARATOR ', ') AS hashtags
            FROM posts p
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN hashtags_to_posts hp ON p.post_id = hp.post_id
            LEFT JOIN hashtags h ON hp.hashtag_id = h.hashtag_id
            LEFT JOIN friends f ON p.user_id = f.followed
            WHERE f.follower = ${req.session.user_id} OR p.user_id = ${req.session.user_id}
            GROUP BY p.post_id
            ORDER BY p.timestamp DESC
            LIMIT 10;
        `);

        console.log("getPosts results:", results);

        const processedResults = results.map(post => ({
            ...post,
            hashtags: post.hashtags ? post.hashtags.split(',') : []
        }));

        return res.status(200).json(processedResults);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};

// GET /getNotifications
var getNotifications = async function (req, res) {
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    try {
        var friendRequestsResults = await db.send_sql(`
            SELECT fr.request_id, fr.sender_id, fr.receiver_id, fr.timestamp, fr.status, 
                   u.username as sender_username, u.pfp_url as sender_pfp
            FROM friend_requests fr
            JOIN users u ON fr.sender_id = u.user_id
            WHERE fr.receiver_id = ${req.session.user_id} AND fr.status = 'pending'
            LIMIT 5
        `);

        var chatInvitesResults = await db.send_sql(`
            SELECT ci.chat_id, ci.sender_id, ci.reciever_id, ci.timestamp, ci.status,
                u.username as sender_username, u.pfp_url as sender_pfp
            FROM chat_invites ci
            JOIN users u ON ci.sender_id = u.user_id
            WHERE ci.reciever_id = ${req.session.user_id} AND ci.status = 'pending'
            LIMIT 5
        `);

        var actorNotificationsResultsSelf = await db.send_sql(`
            SELECT an.user_id, an.actor_nconst, an.timestamp,
            u.username, u.pfp_url
            FROM actor_notifications an
            JOIN users u ON an.user_id = u.user_id
            WHERE an.user_id = ${req.session.user_id}
        `);

        // Fetching actor notifications involving friends
        var actorNotificationsResultsFriends = await db.send_sql(`
            SELECT an.user_id, an.actor_nconst, an.timestamp,
                u.username, u.pfp_url
            FROM actor_notifications an
            JOIN friends f ON an.user_id = f.followed
            JOIN users u ON f.followed = u.user_id
            WHERE f.follower = ${req.session.user_id}
            LIMIT 4
        `);

        var response = {
            results: [...friendRequestsResults.map((request) => (
                {
                    type: 'friendRequest',
                    users: [request.sender_username],
                    date: request.timestamp,
                    profileImage: request.sender_pfp
                }
            )), ...chatInvitesResults.map((invite) => (
                {
                    type: 'chatInvite',
                    users: [invite.sender_username],
                    date: invite.timestamp,
                    profileImage: invite.sender_pfp
                }
            )), ...actorNotificationsResultsSelf.map((notification) => (
                {
                    type: 'association',
                    users: [notification.username],
                    date: notification.timestamp,
                    profileImage: notification.pfp_url
                }
            )), ...actorNotificationsResultsFriends.map((notification) => (
                {
                    type: 'association',
                    users: [notification.username],
                    date: notification.timestamp,
                    profileImage: notification.pfp_url
                }
            ))]
        };

        console.log(response.results);

        return res.status(200).json(response);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};

const routes = {
    get_posts: getPosts,
    get_notifications: getNotifications
};

module.exports = routes;