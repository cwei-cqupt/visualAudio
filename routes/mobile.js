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
    https.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx9d6e4af2463ea1d0&secret=b146bfd18d7b4e18f2510c97e48d1d97', function(access_token_res){
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
    res.pool.query('select server_id from voice where uid=?',req.body.id, function(err, ret){
        if(err) res.send({err: err});
        else{
            res.origin_server_id = ret;
            next();
        }
    });
}, function(req, res, next){
    /*
    *   删除文件, 如果已经在该id上传过该文件， 则此时删除该文件
    * */
    if(res.origin_server_id.length){
        fs.unlink(path.join(upload_dir, req.body.server_id+'.mp3'), function(err){
            if(err) res.send({err: err});
            else next();
        });
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
    var form = new FormData();
    var rs = fs.createReadStream(path.join(upload_dir, req.body.server_id+'.amr'));
    form.append("files[]", rs);
    //form.submit('http://www.yinkeapp.com/amr/server/php/', function(err, res){
    //    if(err) res.send({err: err});
    //    var buf = '';
    //    res.on('data', function(chunk){
    //        buf+=chunk;
    //    });
    //    res.on('end', function(){
    //        console.log(buf);
    //        res.real_link = JSON.parse(buf).url;
    //        next();
    //    });
    //    //res.resume();
    //});

    var request = http.request({
        method: 'POST',
        host: 'www.yinkeapp.com',
        path: '/amr/server/php/',
        headers: form.getHeaders()
    });
    form.pipe(request);
    request.on('response', function(res){
        var buf = '';
        res.on('data', function(chunk){
            buf+=chunk;
        });
        res.on('end', function(){
            res.real_link = JSON.parse(buf)['files'][0].url.replace('.amr', '.mp3');
            console.log(res.real_link);
            next();
        });
    });
},function(req, res, next){
    //next();
    http.get(res.real_link, function(res){
        var rs = fs.createWriteStream(path.join(upload_dir, req.body.server_id+'.mp3'));
        res.pipe(rs);
        res.on('end', function(){
            next();
            //异步删除原来的amr文件,与后面操作无关
            //fs.unlink(path.join(upload_dir, req.body.server_id+'.amr'), function(err){
            //    console.log(err);
            //});
        });
    });
},function(req, res, next){
    /*
     * 存进数据库
     * */
    res.pool.query("insert into voice(uid, server_id) values(?,?)", [req.body.id, req.body.server_id], function(err, ret){
        if(err)res.send({err: err});
        else res.send({err: 'ok'});
    });
});

module.exports = router;