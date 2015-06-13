var request = require('request');
var dao = require('./dao');
var _ = require('underscore');
var $ = require('jquery-deferred');
var express = require('express');
var fs = require('fs');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//store everyones positions
var positions = {};
//sends positions to everyone
setInterval(function(){
    io.emit('pos',positions);
},5000)

var everyone = [];

io.on('connection', function(socket) {
    var user = {
        remote_addr : socket.request.connection.remoteAddress,
        socket : socket
    };
    
    socket.emit('connected',user.socket.id);
    
    //join
    socket.on('join', function(data){
        positions[data] = true;
        io.emit('joined',user.socket.id);
        everyone.push(user)
        console.log(Object.keys(positions),socket.id,user.remote_addr)
    });
    
    //update position
    socket.on('pos', function(data){
        if(positions[user.socket.id]){
            positions[user.socket.id] = {
                x : data.x,
                y : data.y,
                action : data.action,
                nick : user.nick,
                avy : user.avy
            }
        }
    });
    
    //send message
    socket.on('message', function(msg){
        if(user.nick && typeof msg == 'string'){
            io.emit('msg',{
                id : socket.id,
                name : user.nick,
                msg : msg.substring(0, 120)
            })
        } else {
            showMessage('please use /nick to pick a name before chatting :)')
        }
    });
    
    //receive commands
    socket.on('command', function(cmd){
        if(!cmd.name){
            cmd = {
                name : cmd
            }
        }
        for (i = 0; i < cmd.param.length; i++) {//remove useless characters 
            cmd.param[i] = cmd.param[i].replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-');
        }
        console.log(cmd)
        switch(cmd.name){
            case 'nick'://changes a persons nick
                var nick = cmd.param[0].substring(0, 20);
                if(positions[socket.id]){//makes sure person is real
                    dao.find(cmd.param[0]).then(function(data){
                        if(data){//check if nick is registered
                            showMessage('That nick is registered. use /login')
                        } else {
                            if(IndexOf(nick) == -1){//checks if someone in the room is currently using that nick
                                user.nick = nick
                                showMessage('You are now known as ' + user.nick)
                            } else {
                                showMessage('That nick is being used')
                            }
                        }
                    });
                }
                break;
            case 'whois'://return users IP
                    if(user.nick == 'sammich'){//only im allowed to use this for now(sorry)
                        dao.find(cmd.param[0]).then(function(data){
                            if(data){
                                showMessage(data.nick + ' ' + data.IP);
                            } else {
                                showMessage(cmd.param[0] + ' was not found')
                            }
                        });
                    } else {
                        showMessage('not for you')
                    }
                break;
            case 'kick'://disconnect a user
                if(user.nick == 'sammich'){//only im allowed to use this for now(sorry)
                    index = IndexOf(cmd.param[0]);
                    if(index != -1){
                        everyone[index].socket.disconnect();
                        broadcast(cmd.param[0] + ' has been kicked.')
                    } else {
                        showMessage('doesn\'t exist')
                    }
                }
                break;
            case 'register'://so no one else can take the nick
                dao.find(user.nick).then(function(data){
                    if(!data){
                        var pass = cmd.param[0];
                        if(pass.length > 2){
                            dao.register(user.nick,pass).then(function(data){
                                if(data){
                                    showMessage('ERROR')
                                } else {
                                    showMessage(user.nick + ' is now registered')
                                }
                            });
                        } else {
                            showMessage('That password is insecure')
                        }
                    } else {
                        showMessage('That nick is already registered')
                    }
                });
                break;
            case 'login'://login into a reigstered account
                dao.find(cmd.param[0]).then(function(data){
                    if(data){//check if account exist
                        dao.login(cmd.param[0],cmd.param[1]).then(function(data){
                            console.log(data)
                            if(data){
                                user.nick = cmd.param[0];
                                showMessage('You are now known as ' + user.nick)            
                            } else {
                                showMessage('incorrect password')
                            }
                        });
                    } else {
                        showMessage('That account doesn\'t exist')
                    }
                });
                break
            case 'avy'://changes avy
                showMessage('loading new avy...')
                break;
            default:
                showMessage('That\'s not a command.')
        }
    });
    
    socket.on('uploadavy', function(data){
        user.avy = data
    });
    
    //actions!
    socket.on('action', function(action){
        io.emit('action',{
            id : socket.id,
            action : action
        });
    });
    
    //broadcast message to everyone
    function broadcast(msg){
        io.emit('alert',msg);
    }
    
    //return a message to the user
    function showMessage(msg){
        user.socket.emit('alert',msg);
    }
    
    //returns index of user
    function IndexOf(name){
        for (i = 0; i < everyone.length; i++) { 
            if(everyone[i].nick == name){
                return i;
            }
        }
        return -1;
    }
    
    console.log('new connection',user.remote_addr)
    console.log(everyone.length,Object.keys(positions).length)
    socket.on('disconnect', function() {
        var index = IndexOf(user.nick);
        if(index != -1){
            everyone.splice(index, 1)
        }
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