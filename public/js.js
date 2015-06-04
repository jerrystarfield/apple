//socket
var socket = io();
// screen size variables
var SCREEN_WIDTH = 960,
SCREEN_HEIGHT = 576;      

//character canvas
var canvas = document.getElementById('char');
var c = canvas.getContext('2d');

canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

//background canvas
var background = document.getElementById('main');
var bg = background.getContext('2d');

background.width = SCREEN_WIDTH;
background.height = SCREEN_HEIGHT;

//words canvas
var words = document.getElementById('words');
var wd = words.getContext('2d');

words.width = SCREEN_WIDTH;
words.height = SCREEN_HEIGHT;

//$(function(){
    var xpos=0, 
        ypos=0, 
        frameWidth = 32,
        frameHeight = 64;
        
    var hero = {
        dir : {
            up:false,
            right:false,
            down:false,
            left:false
        },
        action : 0
    };
    
    //store everyones current positions
    var positions = {};
    
    //set ID
    socket.on('connected', function(data){
        hero.id = data;
        socket.emit('join',hero.id);
    });
    
    //added joined user
    socket.on('joined', function(data){
        positions[data] = {
            x : 0,
            y : 0,
            xx : 0,
            yy : 0,
            xpos : 0,
            ypos : 0
        }
    });
    
    //remove user when they leave
    socket.on('leave', function(data){
        delete positions[data];
    });
    
    //running multiplier
    var modifyer = 1;
    
    //draw background
    
    var tileset = new Image();
    tileset.src = 'Pub_Base.png'
    
    //size of tiles
    var tileSize = 32;
    var row = 60;
    var col = 36;
    
    tileset.onload = function(){
        for (r = 0; r < col; r++) { 
            for (i = 0; i < row; i++) { 
                if(i * tileSize < SCREEN_WIDTH){
                    //draw background tile
                    bg.drawImage(tileset, tileSize*i, tileSize*r,tileSize,tileSize,(i * tileSize),(r * tileSize),tileSize,tileSize)
                }
            }
        }
        
        //game loop
        setInterval(loop, 5000 / 30);
        setInterval(move, 5);
    }

    //load the avy
    var image = new Image();
    var extra = 0;
    image.src = "penis-2.png"; 
    
    //movement
    $(document).keydown(function(e){
        if(e.keyCode == 39){//right
            hero.dir['right'] = true;
            hero.action = ''
        }
        if(e.keyCode == 37){//left
            hero.dir['left'] = true;
            hero.action = ''
        }
        if(e.keyCode == 40){//down
            if(extra){//sit
                hero.action = 'sit';
                hero.action = 'sit';
            } else {
                hero.dir['down'] = true;
                hero.action = ''
            }
        }
        if(e.keyCode == 38){//up
            hero.dir['up'] = true;
            hero.action = ''
        }
        if(e.keyCode == 16){//run
            modifyer = 2;
        }
        if(e.keyCode == 17){//extra 
            extra = 1;
        }
    });

    $(document).keyup(function(e){
        if(e.keyCode == 39){//right
            hero.dir['right'] = false;
        }
        if(e.keyCode == 37){//left
            hero.dir['left'] = false;
        }
        if(e.keyCode == 40){//down
            hero.dir['down'] = false;
        }
        if(e.keyCode == 38){//up
            hero.dir['up'] = false;
        }
        if(e.keyCode == 16){//run
            modifyer = 1;
        }
        if(e.keyCode == 17){//extra 
            extra = 0;
        }
    });
    
    $('#chat input').focus(function(){
        $('#chat').css('opacity','1.0')
    });

    $('#chat input').blur(function(){
        $('#chat').css('opacity','0.6')
    });
    
    //messaging
    var input = $('#chat input').keydown(function(e){
        if(e.keyCode == 13){
            e.preventDefault();
            var text = input.val();
            if(text){
                socket.emit('message',text);
                input.val('');
            }
        }
    });
   
    //receive message
    socket.on('msg', function(msg){
        li = document.createElement('li');
        message = document.createTextNode('Anonymous: ' + msg.msg);
        li.appendChild(message);
        $('#chat ul').append(li);
        $("#chat ul").animate({ scrollTop: $("#chat ul")[0].scrollHeight }, "slow");
        
        //style text
        wd.font = "12px Comic Sans MS";
        wd.fillStyle = "black";
        wd.textBaseline = 'top';
        
        //measure and draw background
        var width = wd.measureText(msg.msg).width;
        wd.fillRect(positions[msg.id].x,positions[msg.id].y-30,width,18)
        wd.fillStyle = "white";
        wd.fillText(msg.msg,positions[msg.id].x,positions[msg.id].y-30);
        erase(positions[msg.id].x,positions[msg.id].y-30,width) 
    });
   
    //clear message
    function erase(x,y, width){
        setTimeout(function(){
            wd.clearRect(x-1,y-1, width+15,20);
        },5000)
    }
   
    function move(){
        //clear canvas
        c.clearRect(0,0, SCREEN_HEIGHT*2,SCREEN_WIDTH*2);
        //move hero
        if(hero.dir['right']){
            positions[hero.id].xx += 0.3*modifyer;
            ypos = frameHeight*3;
        }
        if(hero.dir['left']){
            positions[hero.id].xx -= 0.3*modifyer;
            ypos = frameHeight*2;
        } 
        if(hero.dir['down']){
            positions[hero.id].yy += 0.3*modifyer;
            ypos = 0;
        } 
        if(hero.dir['up']){
            positions[hero.id].yy -= 0.3*modifyer;
            ypos = frameHeight;
        }
        
        array = Object.keys(positions);
        
        //find who's in front
        sorting = [];
        for (i = 0; i < array.length; i++) { 
            sorting.push([positions[array[i]].y,array[i]])
        }
        
        infront = sorting.sort(function(a, b) {
            return a[0] - b[0];
        });
        array = [];
        for (i = 0; i < infront.length; i++) { 
            array.push(infront[i][1]);
        }
                
        for (i = 0; i < array.length; i++) {
                
            //finds which direction to move
            if(positions[array[i]].x < positions[array[i]].xx){//right
                positions[array[i]].x += 0.3;
                positions[array[i]].ypos = frameHeight*3;
                if(positions[array[i]].x+1 > positions[array[i]].xx){
                    positions[array[i]].x = positions[array[i]].xx
                }
            }
            if(positions[array[i]].x > positions[array[i]].xx){//left
                positions[array[i]].x -= 0.3;
                positions[array[i]].ypos = frameHeight*2;
                if(positions[array[i]].x-1 < positions[array[i]].xx){
                    positions[array[i]].x = positions[array[i]].xx
                }
            }
            if(positions[array[i]].y < positions[array[i]].yy){//down
                positions[array[i]].y += 0.3;
                positions[array[i]].ypos = 0;
                if(positions[array[i]].y+1 > positions[array[i]].yy){
                    positions[array[i]].y = positions[array[i]].yy
                }
            }
            if(positions[array[i]].y > positions[array[i]].yy){//up
                positions[array[i]].y -= 0.3;
                positions[array[i]].ypos = frameHeight;
                if(positions[array[i]].y-1 < positions[array[i]].yy){
                    positions[array[i]].y = positions[array[i]].yy
                }
            }
            if(positions[array[i]].action && positions[array[i]].y == positions[array[i]].yy && positions[array[i]].x == positions[array[i]].xx){//action
                if(positions[array[i]].action == 'sit'){
                    positions[array[i]].ypos = frameHeight*4
                }
            }
            //draw everyone
            c.drawImage(image,positions[array[i]].xpos,positions[array[i]].ypos,frameWidth,frameHeight,positions[array[i]].x,positions[array[i]].y,frameWidth, frameHeight);
        }
    }

    function loop() {        
        //if idle do nothing
        if(hero.dir['right'] || hero.dir['down'] || hero.dir['up'] || hero.dir['left']){
            //move along source image to the next frame
            positions[hero.id].xpos += frameWidth;
            //reach end of source image starting back at the start            
            if (xpos + frameWidth > image.width){
                positions[hero.id].xpos = 0;
            }
        }
        
        //other players walking animation
        array = Object.keys(positions);
        for (i = 0; i < array.length; i++) {
        if(positions[array[i]].x != positions[array[i]].xx || positions[array[i]].y != positions[array[i]].yy)
            positions[array[i]].xpos += frameWidth;
            if (positions[array[i]].xpos + frameWidth > image.width){
                positions[array[i]].xpos = 0;
            }
        }
    }
    //emit position to the server
    setInterval(function(){ 
        socket.emit('pos',{
            x : positions[hero.id].x,
            y : positions[hero.id].y,
            action : hero.action
        });
    }, 3000);
    
    //emit action to the server  
    function action(action){
        socket.emit('action',action);
    };
    
    //receive action
    socket.on('action', function(avy){
        if(avy.action == 'sit'){
            positions[avy.id].ypos = frameHeight*4;
        }
    });
    
    //receive new positions
    socket.on('pos', function(data){
        ary =  Object.keys(data);
            for (i = 0; i < ary.length; i++) {
                if(positions[ary[i]]){
                    //update with new goto location
                    if(ary[i] != hero.id){
                        positions[ary[i]].xx = data[ary[i]].x;
                        positions[ary[i]].yy = data[ary[i]].y;
                        positions[ary[i]].action = data[ary[i]].action
                    }
                } else {
                    //load new person
                    positions[ary[i]] = {
                        x:data[ary[i]].x,
                        y:data[ary[i]].y,
                        xx:data[ary[i]].x,
                        yy:data[ary[i]].y,
                        xpos:0,
                        ypos:0,
                        action:data[ary[i]].action
                    }
                }
            }
    });
    
//});