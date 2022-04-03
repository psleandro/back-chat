require('dotenv').config();
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
let rooms = [];
let messages = [];

io.on('connection', socket => {

    socket.on('join room', (roomId, user) => {
        Object.assign(user, {socketId: socket.id});
        socket.join(roomId);

        if(rooms[roomId]){
            rooms[roomId].push(user);
        } else {
            rooms[roomId] = [user];
            messages[roomId] = [];
        }
        
        const usersRoom = rooms[roomId].filter(u => u.socketId !== socket.id);
        socket.emit('all users connected', usersRoom);
        socket.emit('all messages history', messages[roomId]);

        socket.to(roomId).emit('user-joined', {...user, socketId: socket.id});

        console.log(`now users in the room ${roomId} is: `, rooms[roomId]);

        socket.on('sendMessage', data => {
            console.log(`received message in the room ${roomId}:`, data);
            messages[roomId].push(data);
            io.in(roomId).emit('received message', data);
        });

        socket.on('disconnect', data => {
            console.log('user disconnected!', data);
            rooms[roomId] = rooms[roomId].filter(user =>user.socketId !== socket.id )
            socket.to(roomId).emit('user-disconnected', socket.id);
            console.log(`now users in the room ${roomId} is: ${rooms[roomId]}`);
        })
    });
});

const port = process.env.PORT || 5000;
httpServer.listen(port, () => {
    console.log(`server listening on port: ${port}`);
});