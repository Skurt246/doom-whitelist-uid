const io = require('socket.io')(process.env.PORT || 3000, {
    cors: { origin: "*" },
    proxy: true,
    transports: ['websocket'] // Только быстрые вебсокеты
});

let users = {};

io.on('connection', (socket) => {
    // Регистрация в вайтлисте
    socket.on('join', (id) => {
        users[socket.id] = id;
        io.emit('updateList', Object.values(users));
    });

    // ПРЕМИАЛЬНАЯ СИНХРОНИЗАЦИЯ (Volatile)
    // volatile означает: если интернет мигнул, сервер выкинет старый пакет 
    // и даст самый новый. Это убирает эффект "телепортации" назад.
    socket.on('s', (data) => {
        socket.broadcast.volatile.emit('a', data);
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('updateList', Object.values(users));
    });
});

console.log("Premium Server Started");
