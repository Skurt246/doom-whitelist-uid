const io = require('socket.io')(process.env.PORT || 3000, {
    cors: { origin: "*" },
    transports: ['websocket']
});

let users = {};

io.on('connection', (socket) => {
    socket.on('join', (id) => {
        users[socket.id] = id;
        io.emit('updateList', Object.values(users));
    });

    // Быстрая пересылка: Мастер -> Сервер -> Боты
    socket.on('s', (data) => {
        socket.broadcast.volatile.emit('a', data);
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('updateList', Object.values(users));
    });
});
