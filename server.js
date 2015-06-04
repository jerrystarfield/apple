var request = require('request');

var _ = require('underscore');
var $ = require('jquery-deferred');
var express = require('express');
var fs = require('fs');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//store everyones positions
var positions = {};

io.on('connection', function(socket) {
    var user = {
        remote_addr : socket.request.connection.remoteAddress,
        socket : socket
    };
    
    socket.emit('connected',user.socket.id);
    
    socket.on('join', function(data){
        positions[data] = true;
        io.emit('joined',user.socket.id)
    });
    
    socket.on('pos', function(data){
        if(positions[user.socket.id]){
            positions[user.socket.id] = {
                x : data.x,
                y : data.y,
                action : data.action
            }
        }
        io.emit('pos',positions);
    });
    
    socket.on('message', function(msg){
        io.emit('msg',{
            id : socket.id,
            msg : msg.substring(0, 120)
        })
    });
    
    socket.on('action', function(action){
        io.emit('action',{
            id : socket.id,
            action : action
        });
    });
    
    console.log('new connection',user.remote_addr)
    
    socket.on('disconnect', function() {
        delete positions[user.socket.id];
        io.emit('leave',user.socket.id)
    });
});

app.get('/', function(req, res){
  res.sendfile('index.html');
});
app.use(express.static(__dirname + '/public'));

http.listen(8080, function(){
  console.log('listening on *:80');
});