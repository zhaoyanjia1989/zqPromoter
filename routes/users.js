var express = require('express');
var validator = require('validator');
var captchapng = require('captchapng');
var setting = require('../setting');
var user = require('../model/user');

var router = express.Router();

var BaseN = require('basen');
var baseN = new BaseN({
    base:[
        '1','2','3','4','5','6','7','8','9',
        'a','b','c','d','e','f','g','h','i','j',
        'k','l','m','n','p','q','r','s','t',
        'u','v','w','x','y','z'
    ]
});

router.get('/', function(req, res) {
	console.log("session~~~~~~~~~~:"+req.session.user);
  res.render('login', { message:'',username:'',password:'' });
});

router.get('/signin', function(req, res) {
  res.render('login', { message:'',username:'',password:'' });
});

router.get('/regist', function(req, res) {
  res.render('regist', { message:'',username:'' });
});

router.get('/getCaptcha',function(req, res){
	var number = parseInt(Math.random()*9000+1000)
  var p = new captchapng(80,30,number); // width,height,numeric captcha
  p.color(0, 0, 0, 0);  // First color: background (red, green, blue, alpha)
  p.color(80, 80, 80, 255); // Second color: paint (red, green, blue, alpha)

  var img = p.getBase64();
  var imgbase64 = new Buffer(img,'base64');
  req.session.captcha = number;
  res.writeHead(200, {
            'Content-Type': 'image/png'
        });
  res.end(imgbase64);
});

router.post('/signin', function(req, res) {
  var minute = 24* 60 * 60 * 1000;
  var username = validator.trim(req.body.username);
  var password = validator.trim(req.body.password);

  if(username===setting.username&&password===setting.password){
  	req.session.superUser = {username:username};
  	res.redirect('/admin');
  }else{
	  // 验证信息的正确性
	  if ([username, password].some(function (item) { return item === ''; })) {
	    res.render('login', { message: '信息不完整。',username:username,password:password });
	  }else if (username.length < 4||username.length>32) {
	  	res.render('login', { message: '用户名为4-32位字符。',username:username,password:password });jj
	  }else if (validator.matches(username,/\W+/)){
	  	res.render('login', { message: '用户名只能是数字、字母、下划线。',username:username,password:password });
	  }else{
		  //中青宝登陆
		  user.zqgamelogin(username,password,function(loginUser){
		  	if(loginUser==null) {
			  	res.render('login', { message: '登录失败，请稍后重试。',username:username,password:password});
			  }
			  if(loginUser.status===200){
			  	loginUser.recommendCode = baseN.encode(loginUser.accountid);
			  	req.session.user = loginUser;
				  if (req.body.remember) res.cookie('user', loginUser, { maxAge: minute,signed: true });
				  res.redirect('../');
			  }else if(loginUser.status===501){
			  	res.render('login', { message: '您输入的用户名或者密码有误。',username:username,password:password});
			  }else if(loginUser.status===503){
			  	res.render('login', { message: '您输入的用户名不存在。',username:username,password:password});
			  }else if(loginUser.status===504){
			  	res.render('login', { message: '该账号已被强行锁定。',username:username,password:password});
			  }else{
			  	res.render('login', { message: '未知错误。',username:username,password:password});
			  }
		  });
	  }
	}
});



router.post('/regist', function(req, res) {
  var username = validator.trim(req.body.username);
  var password = validator.trim(req.body.password);
  var password2 = validator.trim(req.body.password2);
  var captcha = validator.trim(req.body.captcha);
  var check = req.body.check;
  // 验证信息的正确性
  if(!check){
  	res.render('regist', { message: '请阅读并同意协议。',username:username});
  }else if ([username, password,password2,captcha].some(function (item) { return item === ''; })) {
    res.render('regist', { message: '信息不完整。',username:username});
  }else if (password!==password2) {
    res.render('regist', { message: '两次密码不一致。',username:username});
  }else if (password.length < 4||password.length>32) {
    res.render('regist', { message: '密码为4-32为字符。',username:username});
  }else if (password==username) {
  	res.render('regist', { message: '密码不能与账号相同。',username:username});
  }else if (req.session.captcha!=captcha){
  	res.render('regist', { message: '验证码不正确。',username:username});
  }else if (username.length < 4||username.length>32) {
  	res.render('regist', { message: '用户名为4-32位字符。',username:username});
  }else if (validator.matches(username,/\W+/)){
  	res.render('regist', { message: '用户名只能是数字、字母、下划线。',username:username});
  }else{
	  //中青宝快速注册
	  user.zqgameregist(username,password,function(registUser){
		  if(registUser==null) {
		  	res.render('regist', { message: '注册失败，请稍后重试。',username:username});
		  }
		  if(registUser.status===200){
		    //中青宝登陆
		    user.zqgamelogin(username,password,function(loginUser){
		    	if(loginUser==null) {
		  	  	res.render('login', { message: '登录失败，请稍后重试。',username:username,password:password});
		  	  }
		  	  if(loginUser.status===200){
		  	  	loginUser.recommendCode = baseN.encode(loginUser.accountid);
		  	  	req.session.user = loginUser;
		  		  res.redirect('/');
		  	  }else if(loginUser.status===501){
				  	res.render('login', { message: '您输入的用户名或者密码有误。',username:username,password:password});
				  }else if(loginUser.status===503){
				  	res.render('login', { message: '您输入的用户名不存在。',username:username,password:password});
				  }else if(loginUser.status===504){
				  	res.render('login', { message: '该账号已被强行锁定。',username:username,password:password});
				  }else{
				  	res.render('login', { message: '未知错误。',username:username,password:password});
				  }
		    });
		  }else if(registUser.status===505){
		  	res.render('regist', { message: '用户名重复。',username:username});
		  }else{
		  	res.render('regist', { message: '未知错误。',username:username});
		  }
	  });
  }
});


router.get('/signout', function(req, res) {
	req.session.destroy(function(err){
		if(err){
			console.log(err);
		}
		else
		{
			res.clearCookie('user');
			res.redirect('/');
		}
	});
});

module.exports = router;
