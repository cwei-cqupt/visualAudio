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
    res.pool.query('select server_id from voice where uid=?',req.query.id,function(err, ret){
        resp.send({err: err, ret: ret});
    });
});

module.exports = router;
