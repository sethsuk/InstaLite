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
    secret: 'nets2120_insecure', saveUninitialized: true, cookie: { httpOnly: false }, resave: true
}));

db.send_sql('TRUNCATE TABLE online');

registry.register_routes(app);

const { Kafka } = require('kafkajs');
let kafka_config = {
    groupId: "nets-2120-group-a",
    bootstrapServers: ["localhost:9092"],
    topic: "Twitter-Kafka"
};

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: kafka_config.bootstrapServers
});

const consumer = kafka.consumer({ 
    groupId: kafka_config.groupId, 
    bootstrapServers: kafka_config.bootstrapServers}
);

const run = async () => {
    // Consuming
    await consumer.connect();
    console.log(`Following topic ${kafka_config.topic}`);
    await consumer.subscribe({ topic: kafka_config.topic, fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(
                JSON.parse(message.value.toString())
            );
        },
    });
};

run().catch(console.error);

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
