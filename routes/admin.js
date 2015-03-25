var express = require('express');
var user = require('../model/user');
var nodeExcel = require('excel-export');
var router = express.Router();
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
  var superUser = req.session.superUser;
  if(superUser){
    var sql="select id, accountname,accountid,recommendcode,phone,actiontime " +
             "from account where flag = 0";
    var sql2 ="select id, accountname,accountid,recommendcode,phone,actiontime " +
             "from account where flag = 1";
    req.getConnection(function(err, connection) {
      connection.query(sql,function(err,rows){
        if(err) log.error("查询出错: ", err.stack);
        rows.forEach(function(row){
          row.actiontime = row.actiontime.Format('yyyy-MM-dd hh:mm:ss');
        });
        connection.query(sql2,function(err,rows2){
          if(err) log.error("查询出错: ", err.stack);
          rows2.forEach(function(row2){
            row2.actiontime = row2.actiontime.Format('yyyy-MM-dd hh:mm:ss');
          });
          res.render('admin',{message: null,checkList:rows,promoterList:rows2});
        });
      });
    });
  }else{
    res.redirect('/user');
  }
});

router.get('/queryaccount', function(req, res) {
    var accountname = req.query.accountname;
    //中青宝获取用户信息
    user.queryaccount(accountname,function(account){
      if(account==null) {
        res.send({message:'查询失败，请稍后重试。'}).end();
      }
      if(account.status===200){
        account.recommendCode = baseN.encode(account.accountid);
        if(!account.phone) account.phone = "";
        res.send({account:account}).end();
      }else if(account.status===501){
        res.send({message:'通行证不存在。'}).end();
      }else{
        res.send({message:'未知错误。'}).end();
      }
    });
});

router.post('/addpromoter', function(req,res){
    var accountid =req.body.accountid.trim();
    var accountname = req.body.accountname.trim();
    var recommendcode = req.body.recommendcode.trim();
    var phone = req.body.phone.trim();
    if(!accountid||!accountname||!recommendcode) res.send({status:500,message:'参数错误。'}).end();
    else{
        var store = {
          accountname:accountname,
          accountid:accountid,
          recommendcode:recommendcode,
          phone:phone,
          actiontime:new Date(),
          flag:1
        }
        var sql="insert into account set ? ";
        req.getConnection(function(err,connection){
          connection.query("select count(1) count from account where accountname = ? and accountid = ? and flag= 1",[accountname,accountid],function(err,rows){
            if(err) {
              log.error("查询出错: ", err.stack);
              res.send({status:500,message:'数据库操作异常。'}).end();
            }
            if(rows[0]['count']>0){
              res.send({status:500,message:'该账号已是推广员。'}).end();
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
    }
});

router.get('/check',function(req,res){
  var id = req.query.id.trim();
  req.getConnection(function(err,connection){
    connection.query("update account set flag = 1 where id = ?",[id],function(err,rows){
      if(err) {
        log.error("更新出错: ", err.stack);
      }
      res.redirect('/admin');
    });
  });
});

router.get('/del',function(req,res){
  var id = req.query.id.trim();
  req.getConnection(function(err,connection){
    connection.query("delete from account where id = ?",[id],function(err,rows){
      if(err) {
        log.error("删除出错: ", err.stack);
      }
      res.redirect('/admin');
    });
  });
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

router.get('/querypay',function(req, res){
  var content = req.query.content;
  var startdate = req.query.startdate;
  var enddate = req.query.enddate;
  var accountid = req.query.accountid;
  if(content==='pay'){
    user.zqgamequerypayinfo(accountid,startdate,enddate,function(result){
      if(result!=null&&result.status==200) {
        pay=result.payRecords;
        pay.forEach(function(info){
          info.recommendCode = baseN.encode(info.tgPassId);
        })
        res.send({status:200,data:pay}).end();
      }
    });
  }else if(content==='pass'){
    user.zqgamequerypassinfo(accountid,startdate,enddate,function(result){
      if(result!=null&&result.status==200) {
        pass=result.registers;
        pass.forEach(function(info){
          info.recommendCode = baseN.encode(info.tgPassId);
        });
        res.send({status:200,data:pass}).end();
      }
    });
  }else{
    res.end();
  }
});


router.get('/excel',function(req,res){
  var content = req.query.content;
  var startdate = req.query.startdate;
  var enddate = req.query.enddate;
  var accountid = req.query.accountid;
  if(content==='pay'){
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
    user.zqgamequerypayinfo(accountid,startdate,enddate,function(result){
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
  }else if(content==='pass'){
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
    user.zqgamequerypassinfo(accountid,startdate,enddate,function(result){
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
  }else{
    res.end();
  }
});


module.exports = router;
