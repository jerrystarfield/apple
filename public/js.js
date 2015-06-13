//socket
var socket = io();

// background size variables
var BACKGROUND_WIDTH = 0,
BACKGROUND_HEIGHT = 0;

//character canvas
var canvas = document.getElementById('char');
var c = canvas.getContext('2d');

//background canvas
var background = document.getElementById('main');
var bg = background.getContext('2d');

//words canvas
var words = document.getElementById('words');
var wd = words.getContext('2d');

//collision canvas
var collision = document.getElementById('collision');
var cn = collision.getContext('2d');

//starting point
startX = 1110;
startY = 429;

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
        action : 0,
        nick : 'anonymous'
    };
    
    //store everyones current positions
    var positions = {};
    
    //set ID
    socket.on('connected', function(data){
        hero.id = data;
        socket.emit('join',hero.id);
    });
    
    //load the avy
    var image = new Image();
    var extra = 0;
    image.src = "penis-2.png"; 
    
    //added joined user
    socket.on('joined', function(data){
        positions[data] = {
            x : startX,
            y : startY,
            xx : startX,
            yy : startY,
            xpos : 0,
            ypos : 0,
            nick : 'anonymous',
            avy : image
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
    tileset.src = 'map_b.png'
    
    //size of tiles
    var tileSize = 32;
    var row = 60;
    var col = 36;
    
    tileset.onload = function(){
        BACKGROUND_WIDTH = tileset.width;
        BACKGROUND_HEIGHT = tileset.height;
                
        //character canvas
        canvas.width = BACKGROUND_WIDTH;
        canvas.height = BACKGROUND_HEIGHT;
        
        //background canvas
        background.width = BACKGROUND_WIDTH;
        background.height = BACKGROUND_HEIGHT;
        
        //words canvas
        words.width = BACKGROUND_WIDTH;
        words.height = BACKGROUND_HEIGHT;
        
        //collision canvas
        collision.width = BACKGROUND_WIDTH;
        collision.height = BACKGROUND_HEIGHT;
        
        var coll = new Image();
        coll.src = 'collision.png';
        coll.onload = function(){
            cn.drawImage(coll,0,0)
        }
                
        /*for (r = 0; r < col; r++) { 
            for (i = 0; i < row; i++) { 
                if(i * tileSize < BACKGROUND_WIDTH){
                    //draw background tile
                    bg.drawImage(tileset, tileSize*i, tileSize*r,tileSize,tileSize,(i * tileSize),(r * tileSize),tileSize,tileSize)
                }
            }
        }*/
        bg.drawImage(tileset,0,0)
        
        //game loop
        setInterval(loop, 5000 / 30);
        setInterval(move, 50);
    }
    
    //movement
    $(document).keydown(function(e){
        if(e.keyCode == 39){//right
            if(extra){
                hero.action = frameHeight*5
            } else {
                hero.dir['right'] = true;
                hero.action = 0
            }
        }
        if(e.keyCode == 37){//left
            if(extra){
                hero.action = frameHeight*6
            } else {
                hero.dir['left'] = true;
                hero.action = 0
            }
        }
        if(e.keyCode == 40){//down
            if(extra){//sit
                hero.action = frameHeight*4
            } else {
                hero.dir['down'] = true;
                hero.action = 0
            }
        }
        if(e.keyCode == 38){//up
            if(extra){
                hero.action = frameHeight*7
            } else {
                hero.dir['up'] = true;
                hero.action = 0
            }
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
    
    $(document).click(function(e){
        if(e.target == words){
            positions[hero.id].x = e.offsetX-16;
            positions[hero.id].y = e.offsetY-64;
        }
    });
    
    $('#chat input').focus(function(){
        $('#chat').css('opacity','1.0')
    });

    $('#chat input').blur(function(){
        $('#chat').css('opacity','0.6')
    });
    
    //modify avy and convert before sending to server
    $('#upload').on('change',function(e){
        //most of this is for making the background transparent for avys that have a solid background 
        var file = this.files[0];
        var reader = new FileReader();
        var color = document.createElement('canvas')
        color.id = 'color'
        $('body').append(color)
        var q = color.getContext('2d');
        var source = new Image();
        reader.onload = function(evt){
            source.src = evt.target.result
            $('#color')[0].width = source.width
            $('#color')[0].height = source.height
            q.drawImage(source,0,0);
            var pixels = q.getImageData(0, 0, source.width, source.height);
            var remove = {
                r : pixels.data[0],
                g : pixels.data[1],
                b : pixels.data[2]
            }
               for(var i = 0, len = pixels.data.length; i < len; i += 4){
                var r = pixels.data[i];
                var g = pixels.data[i+1];
                var b = pixels.data[i+2];

                if(r == remove.r && g == remove.g && b == remove.b){
                    if(remove.r != 0 || remove.g != 0 || remove.b != 0){
                        pixels.data[i+3] = 0;
                    }
                }
            }
            q.putImageData(pixels,0,0);
            color.remove();
            positions[hero.id].avy = new Image()//update client side immediately
            positions[hero.id].avy.src = color.toDataURL();
            socket.emit('uploadavy',color.toDataURL())//send data to server
        }
        reader.readAsDataURL(file);
    });
   
    //commands
    COMMANDS = {
        nick : {
            params : ['nick']
        },
        whois : {
            params : ['nick']
        },
        kick : {
            params : ['nick']
        },
        avy : {
            params : ['url'],
            handle : function(params){
                $('#upload').trigger('click');
            }
        },
        register : {
            params : ['pass']
        },
        login : {
            params : ['nick','pass']
        }
    };
    
    //messaging
    var input = $('#chat input').keydown(function(e){
        if(e.keyCode == 13){
            e.preventDefault();
            var text = input.val();
            if(text){
                if(text[0] == '/'){//emit command
                    var parsed = /^\/(\w+) ?([\s\S]*)/.exec(input.val());
                    var name = parsed[1];
                    var params = parsed[2].split(' ');
                    var cmd = COMMANDS[name];
                    if(cmd){//check that command exist
                        if(cmd.handle){//check if command needs to be sent to the server
                            cmd.handle(params)
                            input.val('');
                        } else {
                            if(cmd.params){//check if command takes any parameters
                                if(params.length == cmd.params.length){//makes sure parameters are filled out
                                    socket.emit('command',{
                                        name : name,
                                        param : params
                                    });
                                } else {
                                    alert(cmd.params.toString(','))
                                }
                            } else {
                                socket.emit('command',parsed[1]);
                            }
                        }
                    }
                } else {//emit message
                    socket.emit('message',text);
                }
                input.val('');
            }
        }
    });
   
    //receive message
    socket.on('msg', function(msg){
        buildMessage(msg,'chat');
    });
   
    //system messages
    socket.on('alert', function(msg){
        alert(msg)
    });
    
    function alert(msg){
        buildMessage({
            name : 'System',
            msg : msg
        },'alert');
    }
    
    function buildMessage(msg,type){
        el = document.createElement('div');
        name = msg.name !== undefined ? msg.name += ': ' : 'Anonymous: ';//checks if name is defined if not equals anonymous
        nameSpan = document.createElement('span');
        nameText = document.createTextNode(name);
        nameSpan.appendChild(nameText);
        message = document.createTextNode(msg.msg);
        el.appendChild(nameSpan);
        el.appendChild(message)
        $('#messages').append(el);
        $("#messages").animate({ scrollTop: $("#messages")[0].scrollHeight }, "slow");
        
        if(type == 'chat'){
            //style text
            wd.font = "12px Comic Sans MS";
            wd.fillStyle = "black";
            wd.textBaseline = 'top';
            
            //measure and draw background
            var width = wd.measureText(msg.msg).width;
            wd.fillRect(positions[msg.id].x-(width/2)+(frameWidth/2),positions[msg.id].y-30,width,18);
            wd.fillStyle = "white";
            wd.fillText(msg.msg,positions[msg.id].x-(width/2)+(frameWidth/2),positions[msg.id].y-30);
            erase(positions[msg.id].x-(width/2)+(frameWidth/2),positions[msg.id].y-30,width) 
        }
    }
   
    //clear message
    function erase(x,y,width){
        setTimeout(function(){
            wd.clearRect(x-1,y-1, width+15,20);
        },5000)
    }
   
    function move(){
        //clear canvas
        c.clearRect(0,0, BACKGROUND_HEIGHT*2,BACKGROUND_WIDTH*2);
        
        var width = $(window).width();
        var height = $(window).height();

        //moving background
        if(positions[hero.id]){
            window.scrollTo(positions[hero.id].x-width/2, positions[hero.id].y-height/2);
        }
        
        
        //move hero
        if(hero.dir['right'] || hero.dir['left'] || hero.dir['down'] || hero.dir['up']){
            var pixelsR = cn.getImageData(positions[hero.id].x+frameWidth+5,positions[hero.id].y+frameHeight,1,1).data;
            var pixelsL = cn.getImageData(positions[hero.id].x-5,positions[hero.id].y+frameHeight,1,1).data;
            var pixelsU = cn.getImageData(positions[hero.id].x,positions[hero.id].y+frameHeight-5,1,1).data;
            var pixelsD = cn.getImageData(positions[hero.id].x,positions[hero.id].y+frameHeight+5,1,1).data;
            
            if(hero.dir['right'] && pixelsR[0] == 0){
                positions[hero.id].x += 5*modifyer;
                positions[hero.id].ypos = frameHeight*3;
            }
            if(hero.dir['left'] && pixelsL[0] == 0){
                positions[hero.id].x -= 5*modifyer;
                positions[hero.id].ypos = frameHeight*2;
            } 
            if(hero.dir['down'] && pixelsD[0] == 0){
                positions[hero.id].y += 5*modifyer;
                positions[hero.id].ypos = 0;
            } 
            if(hero.dir['up'] && pixelsU[0] == 0){
                positions[hero.id].y -= 5*modifyer;
                positions[hero.id].ypos = frameHeight;
            }
        } else if(hero.action) {
            positions[hero.id].ypos = hero.action
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
            if(array[i] != hero.id){
                var pixels = cn.getImageData(positions[array[i]].x+frameWidth,positions[array[i]].y,1,1).data;
                if(positions[array[i]].x < positions[array[i]].xx){//right
                    positions[array[i]].x += 5;
                    positions[array[i]].ypos = frameHeight*3;
                    if(positions[array[i]].x+1 > positions[array[i]].xx){
                        positions[array[i]].x = positions[array[i]].xx
                    }
                }
                if(positions[array[i]].x > positions[array[i]].xx){//left
                    positions[array[i]].x -= 5;
                    positions[array[i]].ypos = frameHeight*2;
                    if(positions[array[i]].x-1 < positions[array[i]].xx){
                        positions[array[i]].x = positions[array[i]].xx
                    }
                }
                if(positions[array[i]].y < positions[array[i]].yy){//down
                    positions[array[i]].y += 5;
                    positions[array[i]].ypos = 0;
                    if(positions[array[i]].y+1 > positions[array[i]].yy){
                        positions[array[i]].y = positions[array[i]].yy
                    }
                }
                if(positions[array[i]].y > positions[array[i]].yy){//up
                    positions[array[i]].y -= 5;
                    positions[array[i]].ypos = frameHeight;
                    if(positions[array[i]].y-1 < positions[array[i]].yy){
                        positions[array[i]].y = positions[array[i]].yy
                    }
                }
                if(positions[array[i]].action && positions[array[i]].y == positions[array[i]].yy && positions[array[i]].x == positions[array[i]].xx){//action
                    positions[array[i]].ypos = positions[array[i]].action
                }
            }
            //draw everyone
            c.drawImage(positions[array[i]].avy,positions[array[i]].xpos,positions[array[i]].ypos,frameWidth,frameHeight,positions[array[i]].x,positions[array[i]].y,frameWidth, frameHeight);
            if(positions[array[i]].nick){
                //make room for flairs in future
                var width = c.measureText(positions[array[i]].nick).width;
                c.font = "bold 10pt Verdana";
                c.fillStyle = 'white';
                c.strokeStyle = 'black';
                
                c.fillText(positions[array[i]].nick,positions[array[i]].x-(width/2)+(frameWidth/2),positions[array[i]].y-5);
                c.strokeText(positions[array[i]].nick,positions[array[i]].x-(width/2)+(frameWidth/2),positions[array[i]].y-5);
                c.fill();
                c.stroke();
            }
        }
    }
    
    function loop() {        
        //if idle do nothing
        if(hero.dir['right'] || hero.dir['down'] || hero.dir['up'] || hero.dir['left']){
            //move along source image to the next frame
            positions[hero.id].xpos += frameWidth;
            //reach end of source image starting back at the start            
            if ( positions[hero.id].xpos + frameWidth > positions[hero.id].avy.width){
                positions[hero.id].xpos = 0;
            }
        }
        
        //other players walking animation
        array = Object.keys(positions);
        for (i = 0; i < array.length; i++) {
        if(positions[array[i]].x != positions[array[i]].xx || positions[array[i]].y != positions[array[i]].yy)
            if(array[i] != hero.id){
                positions[array[i]].xpos += frameWidth;
                if (positions[array[i]].xpos + frameWidth > positions[array[i]].avy.width){
                    positions[array[i]].xpos = 0;
                }
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
        if(avy.action){
            positions[avy.id].ypos = avy.action;
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
                        positions[ary[i]].action = data[ary[i]].action;
                    }
                    if(data[ary[i]].nick){
                        positions[ary[i]].nick = data[ary[i]].nick
                    }
                    if(data[ary[i]].avy){
                        positions[ary[i]].avy = new Image();
                        positions[ary[i]].avy.src = data[ary[i]].avy;
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
                        action:data[ary[i]].action,
                        avy : image
                    }
                }
            }
    });
    
});