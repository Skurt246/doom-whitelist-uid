const io = require('socket.io')(process.env.PORT || 3000, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ['websocket'], // ОТКЛЮЧАЕМ polling
    allowEIO3: true
});

io.on('connection', (s) => {
    console.log('Connected:', s.id);
    s.on('s', (d) => s.broadcast.volatile.emit('a', d));
    s.on('disconnect', () => console.log('Disconnected'));
});
