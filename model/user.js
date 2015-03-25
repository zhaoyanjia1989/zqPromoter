var crypto = require('crypto');
var superagent = require('superagent');
var setting = require('../setting.js');
var log4js = require('log4js');
var log = log4js.getLogger("app");

exports.zqgamelogin = function zqgamelogin(username,password,callback){
  var timestamp = new Date().getTime()+'000';
  var passwordMd5 = crypto.createHash('md5').update(password).digest("hex");
  var systemParam = '2.0:'+setting.apikey+':'+timestamp;
  var m_sign = crypto.createHash('md5').update(username+'001'+passwordMd5+setting.gameid+'0'+systemParam+setting.secretkey).digest("hex");
  var url = 'http://ptlogin.api.zqgame.com/'+'ptLogin/'+username+'/001/'+passwordMd5+'/'+setting.gameid+'/0/'+systemParam+'/'+m_sign;

  console.log('zqgamelogin url:'+url);
	superagent
	.get(url)
	.set('Accept', 'application/json')
	.end(function(error, response){
		if(error){
		    log.error(error);
		    callback(null);
		}
		if(response.status==200){
			var result = JSON.parse(response.text);
			callback(result);
		}else{
			callback(null);
		}
	});
}


exports.zqgameregist = function zqgamelogin(username,password,callback){
  var timestamp = new Date().getTime()+'000';
  var passwordMd5 = crypto.createHash('md5').update(password).digest("hex").toUpperCase();
  var systemParam = '3.0:'+setting.apikey+':'+timestamp;
  var advinfo = '0:'.concat(des('wr_77',setting.secretkey.substring(0,24))).concat(':0');
  var ip = '127.0.0.1';
  var m_sign = crypto.createHash('md5').update(username+passwordMd5+advinfo+ip+setting.gameid+'0'+systemParam+setting.secretkey).digest("hex");
  var url = 'http://reg.api.zqgame.com/'+'quickregister/'+username+'/'+passwordMd5+'/'+advinfo+'/'+ip+'/'+setting.gameid+'/0/'+systemParam+'/'+m_sign;

  console.log('zqgameregist url:'+url);
	superagent
	.get(url)
	.set('Accept', 'application/json')
	.end(function(error, response){
		if(error){
		    log.error(error);
		    callback(null);
		}
		if(response.status==200){
			var result = JSON.parse(response.text);
			callback(result);
		}else{
			callback(null);
		}
	});
}

exports.queryaccount = function queryaccount(accountname,callback){
  var timestamp = new Date().getTime()+'000';
  var systemParam = '2.0:'+setting.apikey+':'+timestamp;
  var m_sign = crypto.createHash('md5').update(accountname+'00'+setting.gameid+'0'+systemParam+setting.secretkey).digest("hex");
  var url = 'http://api.zqgame.com/'+'accountInfoQuery/'+accountname+'/0/0/'+setting.gameid+'/0/'+systemParam+'/'+m_sign;

  console.log('queryaccount url:'+url);
	superagent
	.get(url)
	.set('Accept', 'application/json')
	.end(function(error, response){
		console.log(response.text);
		if(error){
		    log.error(error);
		    callback(null);
		}
		if(response.status==200){
			var result = JSON.parse(response.text);
			callback(result);
		}else{
			callback(null);
		}
	});
}

exports.zqgamequerypassinfo = function zqgamequerypass(accoundid,startdate,enddate,callback){
  var timestamp = new Date().getTime()+'000';
  var systemParam = '2.0:'+setting.apikey+':'+timestamp;
  startdate = startdate||'19900101';
  enddate = enddate||new Date().Format('yyyyMMdd');
  var m_sign = crypto.createHash('md5').update(accoundid+setting.gameid+startdate+enddate+'0'+systemParam+setting.secretkey).digest("hex");
  var url = 'http://search.api.zqgame.com/'+'queryTgBringPassInfo/'+accoundid+'/'+setting.gameid+'/'+startdate+'/'+enddate+'/0/'+systemParam+'/'+m_sign;
  console.log('zqgamequerypass url:'+url);
	superagent
	.get(url)
	.set('Accept', 'application/json')
	.end(function(error, response){
		if(error){
		    log.error(error);
		    callback(null);
		}
		if(response.status==200){
			var result = JSON.parse(response.text);
			callback(result);
		}else{
			callback(null);
		}
	});
}

exports.zqgamequerypayinfo = function zqgamequerypay(accoundid,startdate,enddate,callback){
  var timestamp = new Date().getTime()+'000';
  var systemParam = '2.0:'+setting.apikey+':'+timestamp;
  startdate = startdate||new Date(new Date().valueOf()+(-7)*24*60*60*1000).Format('yyyyMMdd');
  enddate = enddate||new Date().Format('yyyyMMdd');
  var m_sign = crypto.createHash('md5').update(accoundid+setting.gameid+startdate+enddate+'0'+systemParam+setting.secretkey).digest("hex");
  var url = 'http://search.api.zqgame.com/'+'queryTgBringPayInfo/'+accoundid+'/'+setting.gameid+'/'+startdate+'/'+enddate+'/0/'+systemParam+'/'+m_sign;
  console.log('zqgamequerypay url:'+url);
	superagent
	.get(url)
	.set('Accept', 'application/json')
	.end(function(error, response){
		log.info("response");
		if(error){
		    log.error(error);
		    callback(null);
		}
		if(response.status==200){
			var result = JSON.parse(response.text);
			callback(result);
		}else{
			callback(null);
		}
	});
}





/* 3des 加密*/
function des (text,key){
   //encrypt  
  var cipher = crypto.createCipheriv('des-ede3', new Buffer(key), new Buffer(0));  
  cipher.setAutoPadding(true);  //default true  
  var ciph = cipher.update(text, 'utf8', 'base64');  
  ciph += cipher.final('base64');  
  return  Buffer(ciph, 'utf8').toString('hex');
}







// 对Date的扩展，将 Date 转化为指定格式的String 
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
// 例子： 
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function(fmt) 
{ //author: meizz 
  var o = { 
    "M+" : this.getMonth()+1,                 //月份 
    "d+" : this.getDate(),                    //日 
    "h+" : this.getHours(),                   //小时 
    "m+" : this.getMinutes(),                 //分 
    "s+" : this.getSeconds(),                 //秒 
    "q+" : Math.floor((this.getMonth()+3)/3), //季度 
    "S"  : this.getMilliseconds()             //毫秒 
  }; 
  if(/(y+)/.test(fmt)) 
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
  for(var k in o) 
    if(new RegExp("("+ k +")").test(fmt)) 
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length))); 
  return fmt; 
}