const io = require('socket.io')(process.env.PORT || 3000, {
    cors: { origin: "*" },
    transports: ['websocket']
});

io.on('connection', (s) => {
    // Получаем пакет от мастера и мгновенно рассылаем
    s.on('s', (d) => s.broadcast.volatile.emit('a', d)); 
});
