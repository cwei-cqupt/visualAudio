//ajax
define(function(){
    return function(url, method, data, cb){
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(data);

        xhr.onload = function(){
            cb(xhr.responseText);
        };
        xhr.onerror = function(){
            alert("数据获取错误，请重试!!!");
        };
    }
});