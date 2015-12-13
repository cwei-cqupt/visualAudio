require.config({
    baseUrl: "js/lib",
    paths: {
        request: 'request',
        domReady: 'domReady'
    }
});

require(['request', 'domReady'], function(request, domReady){
    domReady(function(){
        var start = document.querySelector('#start');
        var stop = document.querySelector('#stop');
        var play = document.querySelector('#play');
        var upload = document.querySelector('#upload');
        var timer = document.querySelector('#show');
        var isTiming = false;
        var voice = {local_id: '', server_id: ''};
        var tm;

        request('mobile/uploadAudio', 'POST', 'id=1449986036364'+'&server_id=cTSyeFbFLnpqcWKhCOklWks69tslOjhrPfe0MPWwrv2l2phzBIfYTL8rFPIFoDo8', function(res){
            console.log(res);
        });

        wx.ready(function(){
            //开始录音
            start.addEventListener('touchend', function(ev){
                if(isTiming) return false;
                isTiming = true;
                cltimer();
                wx.startRecord({  //开始录制
                    cancel: function () {
                        alert('请您授权录音');
                    },
                    success: function (){
                        timing();
                    }
                });
            });
            //停止录音
            stop.addEventListener('touchend', function () {
                if(!isTiming) return false;
                wx.stopRecord({   //停止录制
                    success: function (res) {
                        isTiming = false;
                        stimer();
                        voice.local_id = res.localId;
                    }
                });
            });

            //播放
            play.addEventListener('touchend', function(){
                if(isTiming || !voice.local_id) return;
                wx.playVoice({
                    localId: voice.local_id // 需要播放的音频的本地ID，由stopRecord接口获得
                });
            });

            //上传
            upload.addEventListener('touchend', function(){
                if(isTiming) return;
                if(!voice.local_id) {
                    alert('请录音!!!');
                    return false;
                }
                wx.uploadVoice({
                    localId: voice.local_id, // 需要上传的音频的本地ID，由stopRecord接口获得
                    isShowProgressTips: 1, // 默认为1，显示进度提示
                    success: function (res) {
                        voice.server_id = res.serverId; // 返回音频的服务器端ID
                        alert('the server_id is: '+ res.serverId);
                        request('mobile/uploadAudio', 'POST', location.search.slice(1)+'&server_id='+res.serverId, function(res){
                            alert(res);
                        });
                    }
                });
            });

        });

        //计时
        function timing(){
           tm = setInterval(function(){
               timer.textContent = +timer.textContent + 1;
           }, 1000);
        }

        //清除计时
        function cltimer(){
            timer.textContent = 0;
        }

        //停止计时
        function stimer(){
            clearInterval(tm);
        }
    });
});



