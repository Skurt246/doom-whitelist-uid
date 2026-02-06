const io = require('socket.io')(process.env.PORT || 3000, { cors: { origin: "*" } });
io.on('connection', (s) => {
    s.on('s', (d) => s.broadcast.volatile.emit('a', d));
});
