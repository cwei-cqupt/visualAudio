require.config({
    baseUrl: "js/lib",
    paths: {
        qrcode: 'qrcode',
        request: 'request',
        domReady: 'domReady',
        visualAudio: 'visualAudio'
    }
});

require(['request', 'domReady', 'visualAudio', 'qrcode'], function(request, domReady, visualAudio, QRCode){
    domReady(function(){
        //页面独立id
        var id = Date.now() + parseInt(Math.random()*10);
        var queen = [];//队列存储 音频server_id

        //生成二维码
        var qrcode = document.querySelector('#qrcode');
//        ?id='+ qrcode.getAttribute('data-id')
        new QRCode(document.getElementById("qrcode"), {
            text:  location.href+'mobile'+'?id='+id,
            width: 100,
            height: 100
        });

        var audio = document.querySelector('#audio');
        var canvas = document.querySelector('#canvas');

        //轮询获取音频
        poolGetAudio();
        function poolGetAudio(){
            return request('/getAudio?id='+id,'GET', null, function(res){
                var data = JSON.parse(res);
                console.log(data);
                if(data.server_id){
                    queen.push(data.server_id);
                }
                //2s之后再获取
                setTimeout(poolGetAudio, 2000);
            });
        }

        //获取acess_token
        function getAcessToken(cb){
            request('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx573a3f616a9481da&secret=a0ce4b53e09c6d9f673c554e92d4f914', 'GET', function(res){
                var data = JSON.parse(res);
                cb(data.access_token);
            });
        }

    });
});



