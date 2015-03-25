var express = require('express');
var user = require('../model/user');
var router = express.Router();
var nodeExcel = require('excel-export');
var log = require('log4js').getLogger("app");

var BaseN = require('basen');
var baseN = new BaseN({
    base:[
        '1','2','3','4','5','6','7','8','9',
        'a','b','c','d','e','f','g','h','i','j',
        'k','l','m','n','p','q','r','s','t',
        'u','v','w','x','y','z'
    ]
});

/* GET home page. */
router.get('/', function(req, res) {
	var currentUser = req.session.user||req.signedCookies.user;
	console.log(req.session.user);
	console.log("currentUser~~~~~~~~~:"+currentUser);
	console.log("session~~~~~~~~~~:"+req.session.user);
	console.log("cookies~~~~~~~~~~:"+req.signedCookies.user);
  if (currentUser) {
    req.getConnection(function(err, connection) {
      connection.query("select count(1) count from account where accountname = ? and accountid = ? and flag = 1",[currentUser.accountname,currentUser.accountid],function(err,rows){
        if(err) log.error("查询出错: ", err.stack);
        if(rows[0]['count']>0){
          var pass = null;
          var pay = null;
          user.zqgamequerypassinfo(currentUser.accountid,null,null,function(result){
            if(result!=null&&result.status==200) {
              pass=result.registers;
              pass.forEach(function(info){
                info.recommendCode = baseN.encode(info.tgPassId);
              })
            }
            user.zqgamequerypayinfo(currentUser.accountid,null,null,function(result){
              if(result!=null&&result.status==200) {
                pay=result.payRecords;
                pay.forEach(function(info){
                  info.recommendCode = baseN.encode(info.tgPassId);
                })
              }
              res.render('index', { sessionUser:currentUser,passinfo:pass,payinfo:pay,now:new Date().Format('yyyyMMdd') });
            })
          })
        }else{
          res.render('needcheck',{sessionUser:currentUser});
        }
      });
    });
  	
  } else {
    res.redirect('/user');
  }
  
});

router.get('/check',function(req,res){
  var currentUser = req.session.user||req.signedCookies.user;
  if(currentUser) 
  {

    var store = {
      accountname:currentUser.accountname,
      accountid:currentUser.accountid,
      recommendcode:currentUser.recommendCode,
      phone:currentUser.phone,
      actiontime:new Date(),
      flag:0
    }
    var sql="insert into account set ? ";
    req.getConnection(function(err,connection){
      connection.query("select count(1) count from account where accountname = ? and accountid = ?",[currentUser.accountname,currentUser.accountid],function(err,rows){
        if(err) {
          log.error("查询出错: ", err.stack);
          res.send({status:500,message:'数据库操作异常。'}).end();
        }
        if(rows[0]['count']>0){
          res.send({status:500,message:'该账号已申请推广员。'}).end();
        }else{
          connection.query(sql,[store],function(err,rows){
            if(err) {
              log.error("插入出错: ", err.stack);
              res.send({status:500,message:'数据库操作异常。'}).end();
            }else{
              res.send({status:200}).end();
            }
          });
        }
      });
    });
  }else{
    res.redirect('/user');
  }
});

router.get('/query',function(req,res){
  var content = req.query.content;
  var startdate = req.query.startdate;
  var enddate = req.query.enddate;
  var currentUser = req.session.user||req.signedCookies.user;
  if(currentUser){
    if(content==='pass'){
      user.zqgamequerypassinfo(currentUser.accountid,startdate,enddate,function(result){
        if(result!=null&&result.status==200) {
          pass=result.registers;
          pass.forEach(function(info){
            info.recommendCode = baseN.encode(info.tgPassId);
          })
          res.send({status:200,data:pass}).end();
        }
      });
    }else if(content==='pay'){
      user.zqgamequerypayinfo(currentUser.accountid,startdate,enddate,function(result){
        if(result!=null&&result.status==200) {
          pay=result.payRecords;
          pay.forEach(function(info){
            info.recommendCode = baseN.encode(info.tgPassId);
          })
        }
        res.send({status:200,data:pay}).end();
      });
    }
  }else{
    res.end();
  }
});

router.get('/excel',function(req,res){
  var content = req.query.content;
  var startdate = req.query.startdate;
  var enddate = req.query.enddate;
  var currentUser = req.session.user||req.signedCookies.user;
  if(currentUser){
    if(content==='pass'){
      var conf ={};
      // uncomment it for style example  
      // conf.stylesXmlFile = "styles.xml";
      conf.cols = [{
          caption:'推广员ID',
          width:30       
      },{
          caption:'推广员名称',
          width:30  
      },{
          caption:'注册时间',
          width:50  
      }];
      user.zqgamequerypassinfo(currentUser.accountid,startdate,enddate,function(result){
        if(result!=null&&result.status==200) {
          pass=result.registers;
        }
        var rows = [] ;
        for (var i = 0; i < pass.length; i++) {
            var o = pass[i];
            d = [];
            for (var u in o) {
                d.push(o[u]);
            }
            rows.push(d);
        }
        conf.rows = rows;
        var result = nodeExcel.execute(conf);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + "passdate "+startdate+"--"+enddate+".xlsx");
        res.end(result, 'binary');
      });
    }else if(content==='pay'){
      var conf ={};
      // uncomment it for style example  
      // conf.stylesXmlFile = "styles.xml";
      conf.cols = [{
          caption:'推广员ID',
          width:30       
      },{
          caption:'充值账号',
          width:30  
      },{
          caption:'充值金额',
          width:50  
      },{
          caption:'充值时间',
          width:50  
      },{
          caption:'充值游戏',
          width:50  
      }];
      user.zqgamequerypayinfo(currentUser.accountid,startdate,enddate,function(result){
        if(result!=null&&result.status==200) {
          pay=result.payRecords;
        }
        var rows = [] ;
        for (var i = 0; i < pay.length; i++) {
            var o = pay[i];
            d = [];
            for (var u in o) {
                d.push(o[u]);
            }
            rows.push(d);
        }
        conf.rows = rows;
        var result = nodeExcel.execute(conf);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + "paydate "+startdate+"--"+enddate+".xlsx");
        res.end(result, 'binary');
      });
    }else{
      res.end();
    }
  }else{
    res.end();
  }
  
  
});

module.exports = router;
