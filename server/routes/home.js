var db = require('../models/database.js');
const helper = require('./route_helper.js');
var path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { request } = require('http');

// GET /getPosts
var getPosts = async function (req, res) {
    if (!helper.isLoggedIn(req, req.params.username)) {
        return res.status(403).json({ error: 'Not logged in.' });
    }

    const page = parseInt(req.query.page) || 1; // Get page number from query parameter or default to 1
    const postsPerPage = 10;
    const startIndex = (page - 1) * postsPerPage;

    try {
        var results = await db.send_sql(`
            SELECT DISTINCT p.post_id, p.title, p.media, p.content, p.likes, date(p.timestamp) AS timestamp,
                            u.user_id, u.username, u.pfp_url, 
                            GROUP_CONCAT(DISTINCT CONCAT('#', h.tag) ORDER BY h.tag ASC SEPARATOR ', ') AS hashtags,
                            (CASE WHEN pl.user_id IS NOT NULL THEN true ELSE false END) AS isLiked
            FROM posts p
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN hashtags_to_posts hp ON p.post_id = hp.post_id
            LEFT JOIN hashtags h ON hp.hashtag_id = h.hashtag_id
            LEFT JOIN friends f ON p.user_id = f.followed
            LEFT JOIN post_likes pl ON p.post_id = pl.post_id AND pl.user_id = ${req.session.user_id}
            WHERE f.follower = ${req.session.user_id} OR p.user_id = ${req.session.user_id}
            GROUP BY p.post_id
            ORDER BY p.timestamp DESC;
        `);

        var limitedResults = results.slice(startIndex, startIndex + postsPerPage);

        const processedResults = limitedResults.map(post => ({
            ...post,
            timestamp: post.timestamp.toDateString(),
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
            SELECT fr.request_id, fr.sender_id, fr.receiver_id, date(fr.timestamp) AS timestamp, fr.status, 
                   u.username as sender_username, u.pfp_url as sender_pfp
            FROM friend_requests fr
            JOIN users u ON fr.sender_id = u.user_id
            WHERE fr.receiver_id = ${req.session.user_id} AND fr.status = 'pending'
            LIMIT 5
        `);

        var friendRequestsResultsAcc = await db.send_sql(`
            SELECT fr.request_id, fr.sender_id, fr.receiver_id, date(fr.timestamp) AS timestamp, fr.status, 
                   u.username as receiver_username, u.pfp_url as receiver_pfp
            FROM friend_requests fr
            JOIN users u ON fr.receiver_id = u.user_id
            WHERE fr.sender_id = ${req.session.user_id} AND fr.status = 'accepted'
            LIMIT 5
        `);

        var friendRequestsResultsRej = await db.send_sql(`
            SELECT fr.request_id, fr.sender_id, fr.receiver_id, date(fr.timestamp) AS timestamp, fr.status, 
                u.username as receiver_username, u.pfp_url as receiver_pfp
            FROM friend_requests fr
            JOIN users u ON fr.receiver_id = u.user_id
            WHERE fr.sender_id = ${req.session.user_id} AND fr.status = 'rejected'
            LIMIT 5
        `);

        var chatInvitesResults = await db.send_sql(`
            SELECT ci.chat_id, ci.sender_id, ci.reciever_id, date(ci.timestamp) AS timestamp, ci.status,
                u.username as sender_username, u.pfp_url as sender_pfp
            FROM chat_invites ci
            JOIN users u ON ci.sender_id = u.user_id
            WHERE ci.reciever_id = ${req.session.user_id} AND ci.status = 'pending'
            LIMIT 5
        `);

        var chatInvitesResultsAcc = await db.send_sql(`
            SELECT ci.chat_id, ci.sender_id, ci.reciever_id, date(ci.timestamp) AS timestamp, ci.status,
                u.username as receiver_username, u.pfp_url as receiver_pfp
            FROM chat_invites ci
            JOIN users u ON ci.reciever_id = u.user_id
            WHERE ci.sender_id = ${req.session.user_id} AND ci.status = 'accepted'
            LIMIT 5
        `);

        var chatInvitesResultsRej = await db.send_sql(`
            SELECT ci.chat_id, ci.sender_id, ci.reciever_id, date(ci.timestamp) AS timestamp, ci.status,
                u.username as receiver_username, u.pfp_url as receiver_pfp
            FROM chat_invites ci
            JOIN users u ON ci.reciever_id = u.user_id
            WHERE ci.sender_id = ${req.session.user_id} AND ci.status = 'rejected'
            LIMIT 5
        `);

        var actorNotificationsResultsSelf = await db.send_sql(`
            SELECT an.user_id, an.actor_nconst, date(an.timestamp) AS timestamp,
            u.username, u.pfp_url
            FROM actor_notifications an
            JOIN users u ON an.user_id = u.user_id
            WHERE an.user_id = ${req.session.user_id}
        `);

        // Fetching actor notifications involving friends
        var actorNotificationsResultsFriends = await db.send_sql(`
            SELECT an.user_id, an.actor_nconst, date(an.timestamp) AS timestamp,
                u.username, u.pfp_url
            FROM actor_notifications an
            JOIN friends f ON an.user_id = f.followed
            JOIN users u ON f.followed = u.user_id
            WHERE f.follower = ${req.session.user_id}
            LIMIT 4
        `);

        var actorNotificationsResultsSelf = await Promise.all(actorNotificationsResultsSelf.map(async (notification) => {
            const actorInfo = await getInfoHelper(notification.actor_nconst);
            return {
                type: 'association',
                users: [notification.username, actorInfo ? actorInfo.name : 'Unknown Actor'],
                date: notification.timestamp.toDateString(),
                profileImages: [notification.pfp_url, actorInfo ? actorInfo.imageUrl : '']
            };
        }));

        console.log(actorNotificationsResultsSelf);

        var actorNotificationsResultsFriends = await Promise.all(actorNotificationsResultsFriends.map(async (notification) => {
            const actorInfo = await getInfoHelper(notification.actor_nconst);
            return {
                type: 'association',
                users: [notification.username, actorInfo ? actorInfo.name : 'Unknown Actor'],
                date: notification.timestamp.toDateString(),
                profileImages: [notification.pfp_url, actorInfo ? actorInfo.imageUrl : '']
            };
        }));

        var response = {
            results: [...friendRequestsResults.map((request) => (
                {
                    type: 'friendRequest',
                    users: [request.sender_username],
                    date: request.timestamp.toDateString(),
                    profileImages: [request.sender_pfp]
                }
            )), ...friendRequestsResultsAcc.map((result) => (
                {
                    type: 'friendRequestAccepted',
                    users: [result.receiver_username],
                    date: result.timestamp.toDateString(),
                    profileImages: [result.receiver_pfp]
                }
            )), ...friendRequestsResultsRej.map((result) => (
                {
                    type: 'friendRequestRejected',
                    users: [result.receiver_username],
                    date: result.timestamp.toDateString(),
                    profileImages: [result.receiver_pfp]
                }
            )), ...chatInvitesResults.map((invite) => (
                {
                    type: 'chatInvite',
                    users: [invite.sender_username],
                    date: invite.timestamp.toDateString(),
                    profileImages: [invite.sender_pfp]
                }
            )), ...chatInvitesResultsAcc.map((invite) => (
                {
                    type: 'chatInviteAccepted',
                    users: [invite.receiver_username],
                    date: invite.timestamp.toDateString(),
                    profileImages: [invite.receiver_pfp]
                }
            )), ...chatInvitesResultsRej.map((invite) => (
                {
                    type: 'chatInviteRejected',
                    users: [invite.receiver_username],
                    date: invite.timestamp.toDateString(),
                    profileImages: [invite.receiver_pfp]
                }
            )), ...actorNotificationsResultsSelf, ...actorNotificationsResultsFriends]
        };

        console.log(response.results);

        return res.status(200).json(response);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};

async function getInfoHelper(nconst) {
    return new Promise((resolve, reject) => {
        const csvFilePath = path.join(__dirname, '..', 'desired.csv');
        console.log('File path:', csvFilePath);
        let found = null;

        fs.createReadStream(csvFilePath)
            .pipe(csv(['id', 'nconst', 'name', 'image', 'url']))
            .on('data', (data) => {
                if (data.nconst === nconst) {
                    found = {
                        nconst: data.nconst,
                        name: data.name.replace(/_/g, ' '), // Replace underscores in names
                        imageUrl: data.url
                    };
                }
            })
            .on('end', () => {
                // Only resolve the promise after finishing reading the CSV
                if (found) {
                    resolve(found);
                } else {
                    resolve(null); // Resolve with null if no actor found
                }
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

const routes = {
    get_posts: getPosts,
    get_notifications: getNotifications
};

module.exports = routes;