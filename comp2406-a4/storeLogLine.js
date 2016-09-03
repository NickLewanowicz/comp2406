// storeLogs.js
//
// node storeLogs.js <logfile>
//
//
// The log messages in the file should be of the format:
// <month> <day of month> <24-hour time in hh:mm:ss> <host> <service name[pid]>: Actual message
//

var mc = require('mongodb').MongoClient;
var fs = require('fs');

var data = fs.readFileSync(process.argv[2], 'utf-8');

var lines = data.split('\n');

var entries = [];

var i, j, entry, field;

for (i=0; i<lines.length; i++) {
    if (lines[i] && lines[i] !== '') {
	field = lines[i].split(' ');
	entry = {};
	j = 0;
	while (j < field.length) {
	    if (field[j] === "") {
		field.splice(j, 1);
	    } else {
		j++;
	    } 
	}
	entry.date = field[0] + " " + field[1];
	entry.time = field[2];
	entry.host = field[3];
	entry.service = field[4].slice(0,-1);
	entry.message = field.slice(5).join(' ');
	entries.push(entry);
    }
}

// entry.date = process.argv[2] + " " + process.argv[3];
// entry.time = process.argv[4];
// entry.host = process.argv[5];
// entry.service = process.argv[6].slice(0,-1);  // drop the trailing colon
// entry.message = process.argv.slice(7).join(' ');

var db;

var reportInserted = function(err, result) {
    if (err) {
	throw err;
    }

    console.log("Inserted the following log record:");
    console.log(result.ops);
    db.close();
}

var connectCallback = function(err, returnedDB) {
    if (err) {
	throw err;
    }

    db = returnedDB;
 
    db.collection('logs').insert(entries, reportInserted);
}

mc.connect('mongodb://localhost/log-demo', connectCallback);
