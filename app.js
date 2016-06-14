var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.engine('.html',require('ejs').__express);
app.use(express.static(__dirname + '/public'));
app.set('views',__dirname+'/views');
app.set('view engine','html');

app.get('/', function(req, res){
    res.render('index')
});
app.get('/enter', function(req, res){
    res.render('enter')
});


//监听websocket链接的通讯
//增加用户
var userId=0,
    userGroup=new Array(),
    userGroupSort=0,
    shakeResult=new Array(),
    scoreList=0;



//监测持续连接
io.on('connection', function(socket,res){

    socket.on('userEnter',function(msg){
        
        userId++;//生成用户


        //判断用户是否满了
        if (userGroup.length<2){
            userGroup[userGroupSort]=userId;
            userGroupSort++;
            console.log('用户组'+ userGroup)
            console.log(userId)
            io.emit('setUser',{ userBind: userId });
            if(userGroup.length==1){
                io.emit('pcToEnter');//向PC端主页发起请求，推送跳转到用户进入页面的事件
                io.emit('firstIn');
            }
            //当两个用户都进入后,向client推送执行showgame event
            if(userGroup.length==2){
                io.emit('showGame');
            }
        }else{
            //房间满后，向client推送roomFull事件
            io.emit('roomFull');
        };



    })


})


// 终端打印如下信息
http.listen(3000, function(){
    console.log('listening on :3000');
});