var db = require('../models/database.js');
const config = require('../../config.json'); // Load configuration
const helper = require('./route_helper.js');

// POST /send friend request
var sendFriendRequest = async function (req, res) {
    const { receiverId } = req.body;

    if (!helper.isOK(receiverId)) {
        return res.status(400).json({ error: 'Invalid input.' });
    }

    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    if (req.session.user_id == receiverId) {
        return res.status(400).json({ error: 'Cannot request yourself.' });
    }

    const senderId = req.session.user_id;

    try {
        // Check if a pending request already exists 
        const query1 = `SELECT COUNT(*) FROM friend_requests
        WHERE sender_id = ${senderId} AND receiver_id = ${receiverId} AND status = 'pending';`;
        const requests = await db.send_sql(query1);

        if (requests[0]["COUNT(*)"] != 0) {
            return res.status(409).json({ error: "A friend request has already been sent to that user." })
        }

        // Check if they are friends  
        const query2 = `SELECT COUNT(*) FROM friends WHERE followed = ${senderId} AND follower = ${receiverId};`
        const results = await db.send_sql(query2);

        if (results[0]["COUNT(*)"] != 0) {
            return res.status(409).json({ error: "You two are already friends." })
        }

        const query3 = `INSERT INTO friend_requests (sender_id, receiver_id, status) 
            VALUES (${senderId}, ${receiverId}, 'pending');`;
        await db.send_sql(query3);

        return res.status(200).json({ message: 'Friend request sent.' });
    } catch (error) {
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// GET /get pending friend requets 
var getFriendRequests = async function (req, res) {
    if (!helper.isLoggedIn(req, req.params.username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    const receiverId = req.session.user_id;
    console.log(receiverId);

    try {
        const query = `SELECT f.request_id, f.sender_id, u.username 
        FROM friend_requests f JOIN users u ON f.sender_id = u.user_id
        WHERE f.receiver_id = ${receiverId} AND f.status = 'pending';`;
        const results = await db.send_sql(query);
        return res.status(200).json({
            friendRequests: results.map(x => ({
                requestId: x.request_id,
                senderId: x.sender_id,
                senderName: x.username
            }))
        })
    } catch (error) {
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// POST /accept friend request
var acceptFriendRequest = async function (req, res) {
    const { senderId } = req.body;

    if (!helper.isOK(senderId)) {
        return res.status(400).json({ error: 'Invalid input.' });
    }

    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    try {
        const receiverId = req.session.user_id;

        const query1 = `UPDATE friend_requests SET status = 'accepted'
            WHERE sender_id = ${senderId} AND receiver_id = ${receiverId} AND status = 'pending'`;
        await db.send_sql(query1);

        const query2 = `INSERT INTO friends (followed, follower)
            VALUES (${senderId}, ${receiverId}), (${receiverId}, ${senderId})`;
        await db.insert_items(query2);

        return res.status(200).json({ message: "Friend request accepted successfully." });
    } catch (error) {
        return res.status(500).json({ error: 'Error querying database.' });
    }
}


// POST /reject friend request
var rejectFriendRequest = async function (req, res) {
    const { requestId } = req.body;

    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    try {
        const receiverId = req.session.user_id;
        const query = `UPDATE friend_requests SET status = 'rejected'
            WHERE request_id = ${requestId} AND receiver_id = ${receiverId} AND status = 'pending';`;
        await db.send_sql(query);
        res.status(200).json({ message: "Friend request rejected successfully." })
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }

}


// GET /get friends (indicate which friends are currently logged in!!)
var getFriends = async function (req, res) {
    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }

    const userId = req.session.user_id;
    try {
        const query = `SELECT DISTINCT u.user_id, u.username, (o.session_id IS NOT NULL) as online
        FROM friends f JOIN users u ON u.user_id = f.followed
        LEFT JOIN online o ON f.followed = o.user_id
        WHERE f.follower = ${userId};`;
        const results = await db.send_sql(query);
        res.status(200).json({
            results: results.map(x => ({
                userId: x.user_id,
                username: x.username,
                online: x.online
            }))
        })
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
}


// POST /remove friend 
var removeFriend = async function (req, res) {
    const { friendId } = req.body;

    const username = req.params.username;
    if (!helper.isLoggedIn(req, username)) {
        return res.status(403).send({ error: 'Not logged in.' });
    }
    try {
        const userId = req.session.user_id;
        console.log(userId);
        const query = `DELETE FROM friends
            WHERE (follower = ${userId} AND followed = ${friendId}) OR (follower = ${friendId} AND followed = ${userId});`;
        await db.send_sql(query);
        res.status(200).json({ message: "Friend request rejected successfully." })
    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
}


var friend_routes = {
    send_friend_request: sendFriendRequest,
    get_friend_requests: getFriendRequests,
    accept_friend_request: acceptFriendRequest,
    reject_friend_request: rejectFriendRequest,
    get_friends: getFriends,
    remove_friend: removeFriend
}

module.exports = friend_routes 