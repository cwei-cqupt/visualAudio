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
        var last_get_time = '',
            last_wave = null;
        //生成二维码
        var qrcode = document.querySelector('#qrcode');
//        ?id='+ qrcode.getAttribute('data-id')
        var $play = document.querySelector('.play');
        var $tip = document.querySelector('.tip');
        new QRCode(document.getElementById("qrcode"), {
            text:  location.href+'mobile'+'?id='+id,
            width: 100,
            height: 100
        });

        //2s轮询获取音频
        poolGetAudio();
        function poolGetAudio(){
            request('/getAudio?id='+id,'GET', null, function(res){
                var data = JSON.parse(res);
                if(data.ret && data.ret.length){
                    if(last_get_time != data.ret[0].time){
                        last_wave && last_wave.destroy();
                        last_get_time = data.ret[0].time;
                        initWave('upload/'+data.ret[0].server_id+'.mp3', function(wavesurfer){
                            $tip.classList.add('active');
                            $play.classList.add('active');
                            $tip.textContent = "获得了上传的音频文件";
                            document.querySelector('#play-container .play').addEventListener('click', function(){
                                $tip.classList.remove('active');
                                $tip.textContent = "正在获取...";
                                wavesurfer.play();
                            });
                        });
                    }
                }
                setTimeout(poolGetAudio, 2000);
            });
        }

        function initWave(src, cb){
            var wavesurfer = Object.create(WaveSurfer);
            last_wave = wavesurfer;
            wavesurfer.init({
                container: '#peaks-container',
                waveColor: 'violet',
                progressColor: 'purple'
            });
            wavesurfer.on('ready', function () {
                //wavesurfer.play();
                cb(wavesurfer);
            });
            wavesurfer.load(src);
        }
    });
});



