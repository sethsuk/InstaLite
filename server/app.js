const express = require('express');
const app = express();
const port = 8080;
const registry = require('./routes/register_routes.js');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

var path = require('path');
const fs = require('fs');
const chromadb = require('./models/chroma.js');

var db = require('./models/database.js');

const session = require('express-session');
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:4567',
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: 'nets2120_insecure', saveUninitialized: true,
    cookie: { secure: false, httpOnly: false, sameSite: 'lax', maxAge: 86400000 }, resave: true
}));

db.send_sql('TRUNCATE TABLE online');

// Imports for socket.io
const socketio = require('socket.io');
const http = require('node:http');

function formatMessage(username, text, time) {
    return {
        username,
        text,
        time
    }
}

const users = [];

async function userJoin(socket_id, username, room) {
    try {
        let result = await db.send_sql(`SELECT user_id FROM users WHERE username = '${username}' LIMIT 1`);
        console.log(result);
        user_id = result[0].user_id;
    } catch (e) {
        console.log(e);
        user_id = 1;
    };
    const user = { socket_id, username, room, user_id };
    users.push(user);
    console.log(user);
    return user;
}

function socketidToUser(socket_id) {
    return users.find((user) => user.socket_id === socket_id);
}

function userLeaves(socket_id) {
    const index = users.findIndex((user) => user.socket_id === socket_id);
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

function usersInRoom(room) {
    return users.filter((user) => user.room === room);
}

const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "http://localhost:4567",
        methods: ["GET", "POST"],
        credentials: false
    }
});
const date = new Date();

io.on("connection", (socket) => {
    socket.on("joinRoom", async ({ username, chatId }) => {
        console.log(`Requested room: ${chatId}`);
        const user = await userJoin(socket.id, username, chatId);

        socket.join(user.room);

        let result = await db.send_sql(`SELECT username, message_id, content, timestamp FROM chat_messages cm LEFT JOIN users u ON cm.user_id = u.user_id WHERE cm.chat_id = ${user.room}`);
        result.map((post) => {
            console.log("sending a post");
            socket.emit("message", formatMessage(post.username, post.content, new Date(Date.parse(post.timestamp)).toLocaleString('en-US')));
        })
        socket.broadcast.to(user.room)
            .emit(
                "message",
                formatMessage("Info", `${user.username} has joined in the chat!`, date.toLocaleString('en-US'))
            );

        io.to(user.room).emit("members", {
            room: user.room,
            users: usersInRoom(user.room),
        });
    });

    socket.on("chatMessage", (msg) => {
        const user = socketidToUser(socket.id);
        if (user) {
          var cleanMsg = msg.replace(/"/g, '\\"')

          io.to(user.room).emit("message", formatMessage(user.username, msg, date.toLocaleString('en-US')));
          db.send_sql(`INSERT INTO chat_messages (chat_id, user_id, content, client_offset) VALUES (${user.room}, ${user.user_id}, "${cleanMsg}", 'test');`);
        }

    });

    socket.on("anouncement", (msg) => {
        const user = socketidToUser(socket.id);
        if (user) {
            io.to(user.room).emit("message", formatMessage("Info", msg, date.toLocaleString('en-US')));
        }
    });

    socket.on("disconnect", () => {
        const user = userLeaves(socket.id);
        if (user) {
            io.to(user.room).emit(
                "message",
                formatMessage("Info", `${user.username} has left in the chat!`, date.toLocaleString('en-US'))
            );


            io.to(user.room).emit("members", {
                room: user.room,
                users: usersInRoom(user.room),
            });

        }

    });
});

const chat_port = 3000;
server.listen(chat_port, () => console.log(`Chat server running at http://localhost:${chat_port}`));

db.send_sql(`
    DELETE FROM friend_requests WHERE timestamp < NOW() - INTERVAL 3 DAY;
`);

db.send_sql(`
    DELETE FROM actor_notifications WHERE timestamp < NOW() - INTERVAL 3 DAY;
`);

db.send_sql(`
    DELETE FROM chat_invites WHERE timestamp < NOW() - INTERVAL 3 DAY;
`);

registry.register_routes(app);

// const { Kafka } = require('kafkajs');
// const { CompressionTypes, CompressionCodecs } = require('kafkajs')

// const SnappyCodec = require('kafkajs-snappy')

// CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec
// let kafka_config = {
//     groupId: "nets-2120-group-java-swingers",
//     bootstrapServers: ["localhost:9092"],
//     topic: "Twitter-Kafka"
// };

// const kafka = new Kafka({
//     clientId: 'my-app',
//     brokers: kafka_config.bootstrapServers
// });

// const consumer = kafka.consumer({
//     groupId: kafka_config.groupId,
//     bootstrapServers: kafka_config.bootstrapServers
// }
// );

// const run = async () => {
//     // Consuming
//     await consumer.connect();
//     console.log(`Following topic ${kafka_config.topic}`);
//     await consumer.subscribe({ topic: kafka_config.topic, fromBeginning: true });

//     await consumer.run({
//         eachMessage: async ({ topic, partition, message }) => {
//             let post = JSON.parse(message.value.toString());
//             console.log(post);
//             results = await db.send_sql(`INSERT INTO posts (title, media, content, user_id) VALUES ('Kafka Test', 'https://variety.com/wp-content/uploads/2023/07/Twitter-rebrands-X.jpg', '${post.text}', 5);`);
//         },
//     });
// };

// run().catch(console.error);


chromadb.initializeCollection()
    .then(() => {
        console.log('Collection initialized and ready to use.');
    })
    .catch(error => {
        console.error('Error during collection initialization:', error);
    });


app.listen(port, () => {
    console.log(`\nMain app listening on port ${port}.\n`);
})
