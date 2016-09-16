// storeLogLine.js
//
// node storeLogLine.js <unquoted log message>
//
// Example:
//    node storeLogLine.js Feb 16 16:08:40 chimera systemd[1]: Started Session c3 of user soma.
//
// The log message should be of the format:
// <month> <day of month> <24-hour time in hh:mm:ss> <host> <service name[pid]>: Actual message
//
var db;
var fs = require('fs');
var mc = require('mongodb').MongoClient;
var Console = require('console').Console;
var entry = {};

var logStream;

var results;
var maxCount = 10;
var serviceExp;
var messageExp;

for (i = 1; i < process.argv.length; i++) {
	var temp = process.argv[i].split("=");
	if(temp[0] === "--results"){
		results = temp[1];
	}
	if(temp[0] === "--maxcount"){
		maxCount = parseInt(temp[1])	;
	}
	if(temp[0] == "--service"){
		serviceExp = new RegExp(temp[1]);
	}else{
		serviceExp = new RegExp(/.*/);
	}
	if(temp[0] == "--message"){
		messageExp = new RegExp(temp[1]);
	}else{
		serviceExp = new RegExp(/.*/);
	}
}

/*
try {
  logStream = fs.createWriteStream(options.logfile, {'flags': 'a'});
} catch(e) {
  logStream = process.stdout;
}
*/

if(results !== null){
    try {
        logStream = fs.createWriteStream(results, {'flags': 'a'});
    } catch(err) {
        logStream = process.stdout;
    }
} else {
	logStream = process.stdout;
}


var myConsole = new Console(logStream);


var findIt = function(db, callback){
    var curs = db.collection('logs').find({service: serviceExp, message: messageExp});
    var matched = [];
    
    curs.each(function (err, log){
        if (log !== null){
	    matched.push(log);
        }else{
	    output(matched);
	    callback();
        }
    });
};

var output = function(matched) {
		if(matched.length > 0){
			var outStr = "";
    	//console.log("Length of log: " + toInsert.length + " MaxCount: " + maxCount);
    	for (var i = 0; i < matched.length && i < maxCount; i++){
        outStr = matched[i].date + " " + matched[i].time + " " + matched[i].host + " " + matched[i] + " " + matched[i].service + ":" + matched[i].message;
				myConsole.log(outStr);
    	}
		}
}

mc.connect('mongodb://localhost/log-demo', function(err,db){
    findIt(db, function(){
        db.close();
    });
});
