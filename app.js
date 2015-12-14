var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cluster = require('cluster');
var os = require('os');
var mysql = require('mysql');

var routes = require('./routes/index');
var users = require('./routes/mobile');

var app = express();

app.use(function(req, res, next){
    res.pool = mysql.createPool({
        connectionLimit : 500,
        database        : 'visul_voice',
        host: '114.215.140.29',
        user            : 'root',
        password        : '54546946'
    });
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/mobile', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//∏∫‘ÿ
if(cluster.isMaster){
    os.cpus().forEach(function(){
        var worker = cluster.fork();
        worker.on('exit', function(err){
            console.log(err);
            cluster.fork();
        });
    });
}else{
    app.listen(18080);
}

