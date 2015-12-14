var express = require('express');
var router = express.Router();
var https = require('https');
var crypto=  require('crypto');
var http = require('http');
var path = require('path');
var FormData = require('form-data');
var fs = require('fs');

//var access_token = '';
var upload_dir = 'public/upload';

//获得 access_token
router.use(function(req, res, next){
    var resp = res;
    https.get('access_token_url', function(access_token_res){
        var access_token = '';
        access_token_res.on('data', function(chunk){
            access_token += chunk;
        });
        access_token_res.on('end', function(){
            res.access_token = JSON.parse(access_token).access_token;
            next();
        });

        access_token_res.on('error', function(err){
            resp.send({"error": err});
        });
    });
});


router.get('/', function(req, res, next) {
    console.log(res.access_token);
    /*
    * 获取 ticket
    * */

    var resp = res;
    //没有获得id
    if(!req.query.id){
        res.send('please enter from the web passage!!!!');
        return false;
    }

    https.get('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token='+res.access_token+'&type=jsapi', function(res){
        var ticket = '';
        res.on('data', function(chunk){
            ticket+=chunk;
        });
        res.on('end', function(){
            //console.log(JSON.parse(ticket).ticket);
            resp.ticket = JSON.parse(ticket).ticket;
            next();
        });
    });
}, function(req, res, next){
    /*
    * 渲染
    * */
    var timestamp = parseInt(Date.now()/1000), //只需要以秒为单位
        nonceStr = 'lijinixn';
    var signature = 'jsapi_ticket='+ res.ticket +'&noncestr='+nonceStr+'&timestamp='+timestamp+'&url=http://smelrain.duapp.com/mobile?id='+req.query.id;
    //sha1
    var sha1 = crypto.createHash('sha1');
    sha1.update(signature);
    var sh_digest = sha1.digest('hex');
    //appid: own: wx573a3f616a9481da
    res.render('mobile', {appid: 'wx9d6e4af2463ea1d0', timestamp: timestamp, nonceStr: nonceStr, signature: sh_digest});
});

//上传audio
router.post('/uploadAudio', function(req, res, next){
    /*
    *    判断原来是否已经存在该页面的音频文件
    * */
    if(!req.body.id){
        res.send({err: 'no id!!!'});
    }
    var resp = res;

    res.pool.getConnection(function(err, connection){
        connection.query('select server_id from voice where uid=?',req.body.id, function(err, ret){
            connection.release();
            if(err) resp.send({err: err});
            else{
                resp.origin_server_id = ret;
                next();
            }
        });
    });
}, function(req, res, next){
    /*
    *   删除文件, 如果已经在该id上传过该文件， 则此时删除该文件
    * */
    if(res.origin_server_id.length){
        fs.stat(path.join(upload_dir, res.origin_server_id[0].server_id+'.mp3'), function(err, state){
            if(state){
                fs.unlink(path.join(upload_dir, res.origin_server_id[0].server_id+'.mp3'), function(err){
                    //todo
                    next();
                });
            }else next();
        });
        //res.send({err: 'you have uploaded, please refresh your brower and try agin!!!'});
        //return false;
    }else next();

},function(req, res, next){
    /*
     * 从weixin服务器下载所上传的音频
     * */
    console.log('download');
    var resp = res;
    http.get('http://file.api.weixin.qq.com/cgi-bin/media/get?access_token='+res.access_token+'&media_id='+req.body.server_id, function(res){
        var ws = fs.createWriteStream(path.join(upload_dir, req.body.server_id+'.amr'));
        res.pipe(ws);
        res.on('end', function(){
            next();
        });
        res.on('error', function(err){
            resp.send({error: err});
        });
    });
}, function(req, res, next){
    /*
    * 上传并转换格式
    * */
    var resp = res;

    var request = http.request({
        hostname: '114.215.140.29',
        port: 18080,
        path:'/media/amr2mp3',
        method: 'POST'
    }, function(res){
        var ws = fs.createWriteStream(path.join(upload_dir, req.body.server_id+'.mp3'));
        res.pipe(ws);
        res.on('end', function(){
            //异步删除 amr文件节约空间
            fs.unlink(path.join(upload_dir, req.body.server_id+'.amr'), function(err){
                //todo
            });
            next();
        });
    });
    var rs = fs.createReadStream(path.join(upload_dir, req.body.server_id+'.amr'));
    rs.pipe(request);
}, function(req, res, next){
    /*
     * 存进数据库
     * */
    var resp = res;
    res.pool.getConnection(function(err, connection){
        if(res.origin_server_id.length){   //如果原来有直接更新数据
            connection.query("update voice set server_id=?, time=? where uid=?", [req.body.server_id, Date.now()+'', req.body.id], function(err, ret){
                connection.release();
                if(err)resp.send({err: err});
                else resp.send({err: 'ok'});
            });
        }else{
            connection.query("insert into voice(uid, server_id, time) values(?,?,?)", [req.body.id, req.body.server_id,Date.now()+''], function(err, ret){
                connection.release();
                if(err)resp.send({err: err});
                else resp.send({err: 'ok'});
            });
        }
    });
});

module.exports = router;

//http://file.api.weixin.qq.com/cgi-bin/media/get?access_token=JQiT0oTL9yKcECTRqv8ZKld4ayXB9ZCNwfhXecA6gLA6u8rBzyxqf2zZldxvqTZdtMe6j8lYa-O3Z0Sx7GwDEeQ7-Ns1WT-3bI-_Yodjw60IERaAFAOKX&media_id=KyOXP8KsP2QCC8r6pH8iBGCKTWgC5pA7uTe5-Qu6EhAA3QRZdL1yASultE2e1UrI
