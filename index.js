const io = require('socket.io')(process.env.PORT || 3000, {
    cors: { origin: "*" }
});

let activeUsers = {}; // Храним { socketId: gameID }

io.on('connection', (socket) => {
    // Когда юзер заходит в игру с читом
    socket.on('join', (gameID) => {
        activeUsers[socket.id] = gameID;
        io.emit('updateList', Object.values(activeUsers));
    });

    // Когда юзер закрывает вкладку или отключается
    socket.on('disconnect', () => {
        delete activeUsers[socket.id];
        io.emit('updateList', Object.values(activeUsers));
    });
});
