var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var id = Date.now();
    res.render('pc', { title: '��Ƶ���ӻ�'});
});

//��ȡ�ϴ�����Ƶ
router.get('/getAudio', function(req, res, next){
    var id = req.query.id;
    if(!id) res.send({err: 'no id'});
    else res.pool.getConnection(function(err, connection){
        if(err) res.send({err: 'database error'});
        else{
            connection.query('select server_id from voice where uid=?',id, function(err, ret){
                console.log(err);
                connection.release();
                if(err) res.send({err: 'database error'});
                else res.send(ret);
            });
        }
    });
});

module.exports = router;
