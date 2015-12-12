var express = require('express');
var router = express.Router();
var https = require('https');
var crypto=  require('crypto');

var startTimer = Date.now();
var access_token = '';
/* GET users listing. */
router.get('/', function(req, resp, next) {
    //获取随机id
    var id = req.query.id;

    get_access_token(false, injectInfo);

    //注入信息
    function injectInfo(ac_token){
        https.get('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token='+ac_token+'&type=jsapi', function(res){
            var bufTk = '';
            res.on('data', function(chunk){
                bufTk+=chunk;
            });
            res.on('end', function(){
                bufTk = JSON.parse(bufTk);

                if(bufTk.errmsg != 'ok'){
                    return get_access_token(true, injectInfo);
                }
                var timestamp = parseInt(Date.now()/1000), //只需要以秒为单位
                    nonceStr = 'lijinixn';
                var signature = 'jsapi_ticket='+ bufTk.ticket +'&noncestr='+nonceStr+'&timestamp='+timestamp+'&url=http://smelrain.duapp.com/mobile?id='+id;
                //sha1
                var sha1 = crypto.createHash('sha1');
                sha1.update(signature);
                var sh_digest = sha1.digest('hex');
                resp.render('mobile', {appid: 'wx573a3f616a9481da', timestamp: timestamp, nonceStr: nonceStr, signature: sh_digest});
            });
        });
    }

    //获得access_token
    function get_access_token(isForce, cb){
        var now = Date.now();
        var overTimer = false;
        if(!access_token || isForce || ( overTimer = (now - startTimer) > 7200000 )/*7200秒*/ ){
            if(isForce || overTimer){
                startTimer = now;
            }
            https.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx573a3f616a9481da&secret=a0ce4b53e09c6d9f673c554e92d4f914', function(res){
                var bufActoken = '';
                res.on('data', function(chunk){
                    bufActoken += chunk;
                });
                res.on('end', function(){
                    bufActoken = JSON.parse(bufActoken);
                    access_token = bufActoken.access_token;
                    cb(access_token);
                });
            });
        }else{
            cb(access_token);
        }
    }
});

//上传audio
router.post('/uploadAudio', function(req, res, next){
    var id = req.body.id,
        server_id = req.body.server_id;
    res.pool.getConnection(function(err, connection){
        if(err){
            res.send({err: 'database error'});
        }else{
            connection.query('insert into voice(uid,server_id) values(?,?)',id,server_id, function(err, ret){
                connection.release();
                if(err) res.send({err: 'database error'});
                else res.send({err: 'ok'});
            });
        }
    });
});

module.exports = router;
