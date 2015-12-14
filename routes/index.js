var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var id = Date.now();
    res.render('pc', { title: '��Ƶ���ӻ�'});
});

/*
* ��ȡ�ϴ�����Ƶ
* */
router.get('/getAudio', function(req, res, next){
    var resp = res;
    res.pool.getConnection(function(err, connection){
        connection.query('select server_id,time from voice where uid=?',req.query.id,function(err, ret){
            resp.send({err: err, ret: ret});
        });
    });
});

module.exports = router;
