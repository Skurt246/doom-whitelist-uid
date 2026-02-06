const io = require('socket.io')(process.env.PORT || 3000, { cors: { origin: "*" } });
let users = {};

io.on('connection', (s) => {
    s.on('join', (id) => { users[s.id] = id; io.emit('updateList', Object.values(users)); });
    s.on('sync', (d) => s.broadcast.emit('action', d)); // Мгновенная пересылка действий
    s.on('disconnect', () => { delete users[s.id]; io.emit('updateList', Object.values(users)); });
});
