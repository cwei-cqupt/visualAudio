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
            //��ʼ¼��
            start.addEventListener('touchend', function(ev){
                if(isTiming) return false;
                isTiming = true;
                cltimer();
                wx.startRecord({  //��ʼ¼��
                    cancel: function () {
                        alert('������Ȩ¼��');
                    },
                    success: function (){
                        timing();
                    }
                });
            });
            //ֹͣ¼��
            stop.addEventListener('touchend', function () {
                if(!isTiming) return false;
                wx.stopRecord({   //ֹͣ¼��
                    success: function (res) {
                        isTiming = false;
                        stimer();
                        voice.local_id = res.localId;
                    }
                });
            });

            //����
            play.addEventListener('touchend', function(){
                if(isTiming || !voice.local_id) return;
                wx.playVoice({
                    localId: voice.local_id // ��Ҫ���ŵ���Ƶ�ı���ID����stopRecord�ӿڻ��
                });
            });

            //�ϴ�
            upload.addEventListener('touchend', function(){
                if(isTiming) return;
                if(!voice.local_id) {
                    alert('��¼��!!!');
                    return false;
                }
                wx.uploadVoice({
                    localId: voice.local_id, // ��Ҫ�ϴ�����Ƶ�ı���ID����stopRecord�ӿڻ��
                    isShowProgressTips: 1, // Ĭ��Ϊ1����ʾ������ʾ
                    success: function (res) {
                        voice.server_id = res.serverId; // ������Ƶ�ķ�������ID
                        alert('the server_id is: '+ res.serverId);
                        request('mobile/uploadAudio', 'POST', location.search.slice(1)+'&server_id='+res.serverId, function(res){
                            alert(res);
                        });
                    }
                });
            });

        });

        //��ʱ
        function timing(){
           tm = setInterval(function(){
               timer.textContent = +timer.textContent + 1;
           }, 1000);
        }

        //�����ʱ
        function cltimer(){
            timer.textContent = 0;
        }

        //ֹͣ��ʱ
        function stimer(){
            clearInterval(tm);
        }
    });
});



