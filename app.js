var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mustacheExpress = require('mustache-express');
var fs = require('fs');
var FileStreamRotator = require('file-stream-rotator');
var debug = require('debug')('zonemap:app');
var config  = require('config');

//routes
var index = require('./routes/index');
//var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', mustacheExpress());
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

//app.use(logger('dev'));
var logDirectory = __dirname + '/log'
// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
// create a rotating write stream
var accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: logDirectory + '/access-%DATE%.log',
  frequency: 'daily',
  verbose: false
})
//change date format and timezone to local
logger.token('date', function(){
  return new Date().toString()
})
// log all requests to access.log
app.use(logger('combined', {stream: accessLogStream}))

// log only 4xx and 5xx responses to console
app.use(logger('dev', {
  skip: function (req, res) { return res.statusCode < 400 }
}))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true,
    cookie: { 
      maxAge: config.get('ZoneMap.session.timeout')
    }
}));

//Rules for routes
app.use('/', index);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);

  var view = {
    "template_error": true,
    "message": err.message,
    "status": err.status,
    "error": err
  };
  debug("message: " + err.message);
  debug("status: " + err.status);
  debug("err: " + err.err);
  res.render('layout.html', view);
});

module.exports = app;
