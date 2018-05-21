var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var logger = require("verbose-console-log");
var port = 3000;
server.listen(port);
app.use(express.static(__dirname + '/public'));
var key_store = new Array();

io.on('connection', function (socket) {
    var name = 'User_' + (socket.id).toString().substr(1,4);
    socket.broadcast.emit('newUser', name);
    socket.emit('userName', name);
    socket.on('message', function(data){
        logger.warn('User: ' + name + ' | Message: ' + data);
        socket.broadcast.emit('messageToClients', data, name);
    });
    socket.on('key', function(key){
        key_store.push({"user":name, "key":key});
        logger.warn('User: ' + name + ' | KEY: ' + key);
        io.sockets.emit('keyToClients', key_store);
    });
});
