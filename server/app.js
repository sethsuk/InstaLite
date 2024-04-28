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
