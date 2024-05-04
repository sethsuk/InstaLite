const express = require('express');
const app = express();
const port = 8080;
const registry = require('./routes/register_routes.js');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

var path = require('path');
const fs = require('fs');
const chromadb = require('./models/chroma.js');

// var db = require('./models/database.js');

const session = require('express-session');
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:4567',
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: 'nets2120_insecure', saveUninitialized: true, cookie: { httpOnly: false }, resave: true
}));

// db.send_sql('TRUNCATE TABLE online');

// Imports for socket.io
const socketIO = require('socket.io');
const nodeHTTP = require('node:http');


const server = nodeHTTP.createServer(app);
const io = new socketIO.Server(server, {
    connectionStateRecovery: {},
});

app.get('/chat', (req, res) => {
    if (req.query['room'] == "room2") {
        res.sendFile(`/nets2120/project-java-swingers/server/room2.html`);
    } else {
        res.sendFile(`/nets2120/project-java-swingers/server/room1.html`);
    }
    
});

io.on('connection', async (socket) => {
    socket.on('chat message', async (msg, params, callback) => {
    let result;
    let clientOffset = params['clientOffset'];
    console.log(params);
    // try {
    //   result = await db.run('INSERT INTO messages (content, client_offset) VALUES (?, ?)', msg, clientOffset);
    // } catch (e) {
    //   if (e.errno === 19 /* SQLITE_CONSTRAINT */ ) {
    //     callback();
    //   } else {
    //     // nothing to do, just let the client retry
    //   }
    //   return;
    // }

    result = {lastID: 5};
    io.sockets.in(params.room).emit('chat message', msg, {serverOffset: result.lastID, user: clientOffset});
    callback();
    });

socket.on('subscribe', function(room) { 
    console.log('joining room', room);
    socket.join(room); 
})

socket.on('unsubscribe', function(room) {  
    console.log('leaving room', room);
    socket.leave(room); 
})



//   if (!socket.recovered) {
//     try {
//       await db.each('SELECT id, content FROM messages WHERE id > ?',
//         [socket.handshake.auth.serverOffset || 0],
//         (_err, row) => {
//           socket.emit('chat message', row.content, row.id);
//         }
//       )
//     } catch (e) {
//       // something went wrong
//     }
//   }
});
  
  
let chat_port = 3000;
server.listen(chat_port, () => {
    console.log(`Chat server running at http://localhost:${chat_port}`);
});
  




registry.register_routes(app);

const { Kafka } = require('kafkajs');
const { CompressionTypes, CompressionCodecs } = require('kafkajs')

const SnappyCodec = require('kafkajs-snappy')

CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec
let kafka_config = {
    groupId: "nets-2120-group-java-swingers",
    bootstrapServers: ["localhost:9092"],
    topic: "Twitter-Kafka"
};

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



// chromadb.initializeCollection()
//     .then(() => {
//         console.log('Collection initialized and ready to use.');
//     })
//     .catch(error => {
//         console.error('Error during collection initialization:', error);
//     });


app.listen(port, () => {
    console.log(`\nMain app listening on port ${port}.\n`);
})
