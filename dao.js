var _ = require('underscore');
var $ = require('jquery-deferred');
var mysql = require('mysql');
var passwordHash = require('password-hash');
var fs = require('fs');
var settings;

try {
    var file = fs.readFileSync('settings.json');
    settings = JSON.parse(file.toString());
} catch (e) {
    throw new Error('Invalid settings: /conf/settings.json invalid or does not exist');
}

var db = mysql.createConnection({
    host: 'localhost',
    user: settings.db.user,
    password: settings.db.password,
    database: 'visual'
});

    db.connect(function(err){
        if(err) console.log(err)
    });
    
module.exports = {
    register : function(nick,pass){
        var defer = $.Deferred();
        var sql = "INSERT INTO `visual`.`users` (`nick`, `pass`, `IP`) VALUES ('" + nick + "', '" + passwordHash.generate(pass) + "', ':)')";
        db.query(sql, function(err, rows, fields){
            defer.resolve(err).promise();
        });
        return defer;
    },
    find : function(nick){
        var defer = $.Deferred();
        var sql = "SELECT * FROM `users` WHERE `nick` = '" + nick + "'";
        db.query(sql, function(err, rows, fields){
            if(rows && rows[0]){//fix
                defer.resolve(rows[0]).promise();
            } else {
                defer.resolve(false).promise();
            }
        });
        return defer;
    },
    login : function(nick,pass){
        var defer = $.Deferred();
        var sql = "SELECT * FROM `users` WHERE `nick` = '" + nick + "'";
        db.query(sql, function(err, rows, fields){
            if(passwordHash.verify(pass,rows[0].pass)){
                defer.resolve(true).promise();
            } else {
                defer.resolve(false).promise();
            }
        });
        return defer;
    }
}