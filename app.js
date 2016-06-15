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
app.get('/mobile', function(req, res){
    res.render('mobile')
});
app.get('/full', function(req, res){
    res.render('full')
});



//监听websocket链接的通讯
//增加用户
var userId=0,
    userGroup=new Array(),
    userGroupSort=0,
    shakeResult=new Array(),
    scoreList=0,
    handSign,
    equalTxt="equal"
    winTxt="win",
    loseTxt="lose";



//监测持续连接
io.on('connection', function(socket,res){

    //接受移动端用户进入请求，并推送给PC主页进行跳转
    socket.on('userEnter',function(msg){
        setUser();
    });


    //
    function setUser(){

        userId++;//生成用户序位

        //判断用户是否满了
        if (userGroup.length<2){
            userGroup[userGroupSort]=userId;
            userGroupSort++;
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
            socket.emit('roomFull');
        };

    }

    //监测用户进入数量
    function checkUser(){
        socket.on('checkUser',function(){
            //console.log(userGroup.length)
            if(userGroup.length==1){
                io.emit('oneIn')
            }
            if(userGroup.length==2){
                io.emit('allIn')
            }
        })

    }
    checkUser();


    //摇一摇
    //从移动端接收对应用户id

    socket.on('shakePhone',function(data){
        var urNum = Math.floor(Math.random() * 3 + 1);
        if(urNum==1){
            var handSign="剪刀"
        }else if(urNum==2){
            var handSign="布"
        }else if(urNum==3){
            var handSign="石头"
        }
        var arr={
            "name":data,
            "score":urNum,
            "sign":handSign,
        }
        scoreList++
        shakeResult.push(arr);
        //摇一摇所有用户完成后，返回结果

        if(shakeResult.length==1){
            io.emit('oneShaked',shakeResult)
        }
        if(shakeResult.length==2){
            //console.log(shakeResult);
            ComResult(shakeResult);
            io.emit('backResult',shakeResult)
        }

    })


    //处理摇一摇结果
     function ComResult(data){
        if(data[0].score==data[1].score){
            //数值相等
            for(var i=0;i<data.length;i++){
                data[i]['result']=equalTxt
            }
        }else{
            var compareScore=data[0].score-data[1].score;
            //非全等时
            if(compareScore>0){
                if(compareScore==1){
                    data[0]['result']=winTxt;
                    data[1]['result']=loseTxt;
                }else{
                    data[0]['result']=loseTxt;
                    data[1]['result']=winTxt;
                }

            }else{
                compareScore=compareScore*-1;
                if(compareScore==1){
                    data[0]['result']=loseTxt;
                    data[1]['result']=winTxt;
                }else{
                    data[0]['result']=winTxt;
                    data[1]['result']=loseTxt;
                }
            }

        }
     }


     //restartGame
     socket.on('restartGame',function(){
        userGroup.splice(0,userGroup.length);
        shakeResult.splice(0,shakeResult.length);
        io.emit('rePlay');
     })

     //restartGame,初始化用户列表以及相关数据
     socket.on('newGame',function(){
        userId=0;
        userGroupSort=0;
        scoreList=0;
        userGroup.splice(0,userGroup.length);
        shakeResult.splice(0,shakeResult.length);
     })

})


// 终端打印如下信息
http.listen(3000, function(){
    console.log('listening on :3000');
});