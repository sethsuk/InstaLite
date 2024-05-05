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
