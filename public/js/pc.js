require.config({
    baseUrl: "js/lib",
    paths: {
        qrcode: 'qrcode',
        request: 'request',
        domReady: 'domReady',
        visualAudio: 'visualAudio',
        peaks: 'peaks.min',
        wavesurfer: 'wavesurfer.min'
    }
});

require(['request', 'domReady', 'visualAudio', 'qrcode', 'peaks', 'wavesurfer'], function(request, domReady, visualAudio, QRCode, Peaks, Wavesurfer){
    domReady(function(){
        //console.log(peaks);
        //页面独立id
        var id = Date.now() + parseInt(Math.random()*10);

        //生成二维码
        var qrcode = document.querySelector('#qrcode');
//        ?id='+ qrcode.getAttribute('data-id')
        new QRCode(document.getElementById("qrcode"), {
            text:  location.href+'mobile'+'?id='+id,
            width: 100,
            height: 100
        });

        //var ctr = {
        //    timer: null,
        //    get isGet(){
        //        return this._get;
        //    },
        //
        //    set isGet(v){
        //        this._get = v;
        //        if(this._get)
        //    },
        //
        //    get isPlayed(){
        //    },
        //
        //    poolGetAudio: function(){
        //    }
        //};

        var isGet = false,   //是否已经获取到
            isPlayed = false; //是否已经播放过

        var audio = document.querySelector('#audio');
        var canvas = document.querySelector('#canvas');

        //轮询获取音频
        //poolGetAudio();
        function poolGetAudio(){
            request('/getAudio?id='+id,'GET', null, function(res){
                var data = JSON.parse(res);
                console.log(data);
                if(data.server_id){
                    queen.push(data.server_id);
                }
                //2s之后再获取
                setTimeout(poolGetAudio, 2000);
            });
        }

        var wavesurfer = Object.create(WaveSurfer);
        wavesurfer.init({
            container: '#peaks-container',
            waveColor: 'violet',
            progressColor: 'purple'
        });
        wavesurfer.on('ready', function () {
            wavesurfer.play();
        });
        wavesurfer.load('upload/BEYOND-earth.mp3');
    });
});



