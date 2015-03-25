var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var session = require("express-session");
var bodyParser = require('body-parser');
var log4js = require('log4js');
var log = log4js.getLogger("app");

var routes = require('./routes/index');
var users = require('./routes/users');
var admin = require('./routes/admin');

var SessionStore = require('express-mysql-session');
var connection  = require('express-myconnection'); 
var mysql = require('mysql');

var store = new SessionStore({
        // host: 'localhost',
        // user: 'root',
        // password : 'root',
        host: '183.60.255.65', 
        user: 'store_update',
        password : 'update@$!##',
        port : 3306, 
        database:'promoter',
        useConnectionPooling: true
    });

var app = express();

// 数据库链接
app.use(
    connection(mysql,{
        // host: 'localhost',
        // user: 'root',
        // password : 'root',
        host: '183.60.255.65', 
        user: 'store_update',
        password : 'update@$!##',
        port : 3306, 
        database:'promoter'
    },'pool')
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto' }));
app.use(session({secret: 'zqgamePromoterSessions',store:store,saveUninitialized: true,resave: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('zqgamePromoterCookies'));


app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));

app.use('/', routes);
app.use('/user', users);
app.use('/admin',admin);

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

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
