const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors  = require('cors');

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
});

app.use('/', (req, res) => {
    res.send('ok');
});

let users = [];
let messages = [];

io.on('connection', socket => {

    socket.on('join room', user => {
        console.log('user joined:', {...user, socketId: socket.id});
        users.push({...user, socketId: socket.id});

        socket.emit('all messages history', messages);
        
        const otherUsers = users.filter(u => u.socketId !== socket.id);
        socket.emit('all users connected', otherUsers);
        console.log('users, ', users)
    });

    socket.on('sendMessage', data => {
        console.log('received message:', data);
        messages.push(data);

        socket.emit('received my own message', data);
        socket.broadcast.emit('received message', data);
    });
});

httpServer.listen(5000, () => {
    console.log('listening on port 5000');
});