var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectID;

//Multer required to upload files
var multer  = require('multer')
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })

//Track the number of logs and entries
var logs = [];
var logEntries = 0;

//New Require for mongoclient
var mc = require('mongodb').MongoClient;



router.get('/', function(req, res) {
    res.render('index', {title: 'COMP 2406 Log Analysis & Visualization',
			 numFiles: logs.length,
			 numEntries: logEntries});
});
//function
var exists = function(input){
    return input && input != '';
}
function getLogs(query, returnQuery) {
    // use query object to retrieve logs from server
    // return an array of log objects
    // NOTE: you may need to add properties to these objects to get the
    // required functionality
    /*
    console.log("Processing query:");
    console.log(query);
    var dummyLogs = [{ "_id" : ObjectId("56d66dffec898bf912744e0a"),
		       "file" : "/var/log/syslog",
		       "date" : "Mar 1",
		       "time" : "19:40:28",
		       "host" : "chimera",
		       "service" : "org.gnome.evolution.dataserver.Sources4[1753]",
		       "message" : "** (evolution-source-registry:2004): WARNING **: secret_service_search_sync: must specify at least one attribute to match" },
		     { "_id" : ObjectId("56d66dffec898bf912744e0b"),
		       "file" : "/var/log/syslog",
		       "date" : "Mar 1",
		       "time" : "20:17:01",
		       "host" : "chimera",
		       "service" : "CRON[3572]",
		       "message" : "(root) CMD ( cd / && run-parts --report /etc/cron.hourly)" },
		     { "_id" : ObjectId("56d66dffec898bf912744e0c"),
		       "file" : "/var/log/syslog",
		       "date" : "Mar 1",
		       "time" : "21:17:01",
		       "host" : "chimera",
		       "service" : "CRON[3660]",
		       "message" : "(root) CMD ( cd / && run-parts --report /etc/cron.hourly)" }];
    returnQuery(dummyLogs);
    */
    //Print when the query is parsed and what it is
    console.log("Processing query:");
    console.log(query);
    //Variables to store the modified logs
    var parsedLog = [];
    //Mongodb to access
    var db;

    //Function copied from uploadText to catch DB errors
    var connectCallback = function(err, returnedDB) {
        if (err) {
          throw err;
        }
        //simple function to get data from db and put it into parsedLogs
        var toArrayCallback = function(err,data) {
          for(var i in data){
            parsedLog[i] = data[i];
          }
          returnQuery(parsedLog);
        }
        //save current database
        db = returnedDB;
        //define parameters of queryObject as regular expressions
        //this way of defining regular expressions was found online
        var queryObject = {};
        if(query.date != ""){queryObject.date = {$regex: query.date};}
        if(query.month != ""){queryObject.month = {$regex: query.month};}
        if(query.day != ""){queryObject.day = {$regex: query.day};}
        if(query.service != ""){queryObject.service = {$regex: query.service};}
        if(query.message != ""){queryObject.message = {$regex: query.message};}
        if(query.file != ""){queryObject.file = {$regex: query.file};}


        //only keep relevent logs
        db.collection('log-demo').find(queryObject).toArray(toArrayCallback);
    }

    mc.connect('mongodb://localhost/log-demo', connectCallback);
}

function entriesToLines(theLogs) {
    //Base Code
    //return ["Here are log entries",
    //"One per line",
    //"Just as they were uploaded."].join('\n');

    //string to return
    var theString = "";
    //add each element from theLogs to string
    for(i in theLogs){
      theString += theLogs[i].date + " " + theLogs[i].time + " " + theLogs[i].host + " " + theLogs[i].service + " " + theLogs[i].message + "\n";
    }
    //return string
    return theString
}

function analyzeSelected(theLogs) {
  // Return the log stats necessary for
  // the data passed to visualize.jade

  // dummy data the chart.js example bar graph
  /*var data = {
	labels: ["Feb 3", "Feb 4", "Mar 1", "Mar 6", "Mar 8", "Mar 23"],
	datasets: [
            {
		label: "Feb 16",
		fillColor: "rgba(151,187,205,0.5)",
		strokeColor: "rgba(151,187,205,0.8)",
		highlightFill: "rgba(151,187,205,0.75)",
		highlightStroke: "rgba(151,187,205,1)",
		data: [28, 48, 40, 19, 86, 27]
            }
	]
    };

    return "var data = " + JSON.stringify(data);
  */

  //Declare necessary variables
  var flag = false;
  var data = {
    labels: [],
    datasets: [
              {
                label: "",
            		fillColor: "rgba(151,187,205,0.5)",
            		strokeColor: "rgba(151,187,205,0.8)",
            		highlightFill: "rgba(151,187,205,0.75)",
            		highlightStroke: "rgba(151,187,205,1)",
            		data: []
              }
              ]
              };
  console.log("Starting loops");
  //loop to check all dates of logs
  for(a in theLogs){
    //console.log("If first loop");
    //loop to check all labels in
    for(b in data.labels){
      //console.log("Second loop");
      //we increment the data if the date exists already
      if (theLogs[a].date === data.labels[b]){
        flag = true;
        //console.log("Date: " + theLogs[a].day);
        data.datasets[0].data[b]++;
      }
    }
    //else we add the data to out dataset
    if(theLogs[a] !== null && theLogs[a].date !== null && flag === false){
      //console.log("Adding " + theLogs[a]);
      data.labels[data.labels.length] = theLogs[a].date;
      data.datasets[0].data[data.datasets[0].data.length] = 1;
    }
    flag = false;
  }
  //return function to be used by the res render visu
  return "var data = " + JSON.stringify(data);
}
//Function form copied from tutorial 7
function uploadLog(req, res) {
    console.log("uploadText function called");
    var path = require('path');
    var theFile = req.file;
    if (req.file) {
      //If statement copied from tutorial 5
      var logFile = theFile.originalname;
      var rawContents = theFile.buffer.toString('utf-8');
      var lines = rawContents.split('\n');
      var arrayOutput = [];
      var lineOutput = "";

      for (i = 0; i < lines.length; i++) {
          //remove double spaces and split
          var tempContents = lines[i].replace("  "," ").split(' ');
          var message = "";
          for(j = 5; j<tempContents.length;j++){
            message = message + " " + tempContents[j];
          }
          var entry = {};
          entry.date = tempContents[0] + " " + tempContents[1];
          entry.month = tempContents[0];
          entry.day = tempContents[1];
          entry.time = tempContents[2];
          entry.host = tempContents[3];
          entry.service = tempContents[4];
          entry.message = message;

          arrayOutput.push(entry);
      }
      logs[logs.length] = logFile;
      logEntries += arrayOutput.length;

      var reportInserted = function(err, result) {
        if (err) {
          throw err;
        }

        console.log("Inserted the following log record:");
        console.log(result.ops[0]);
        db.close();
        res.send("File uploaded succeeded");
      }

      var connectCallback = function(err, returnedDB) {
        if (err) {
          throw err;
        }

        db = returnedDB;

        db.collection('log-demo').insert(arrayOutput, reportInserted);
      }

      mc.connect('mongodb://localhost/log-demo', connectCallback);


  } else {
	     res.send("File upload failed");
    }

}

function login(req, res) {
    var username = req.body.username;
    req.session.username = username;
    req.session.files = [];
    req.session.stats = [];
    loggedInUsers[username] = LoggedIn;
    res.redirect("/users")
}

function logout(req, res) {
    delete loggedInUsers[req.session.username];
    req.session.destroy(function(err){
        if(err){
            console.log("Error: %s", err);
        }
    });
    res.redirect("/");
}

function doQuery(req, res) {

    var query = { message: req.body.message,
		  service: req.body.service,
		  file: req.body.file,
		  month: req.body.month,
		  day: req.body.day,
		  queryType: req.body.queryType};

    function returnQuery(theLogs) {
	if (query.queryType === 'visualize') {
	    res.render('visualize', {title: "Query Visualization",
				     theData: analyzeSelected(theLogs)});
	} else if (query.queryType === 'show') {
	    res.render('show', {title: "Query Results", logs: theLogs});
	} else if (query.queryType === 'download') {
	    res.type('text/plain');
	    res.send(entriesToLines(theLogs));
	} else {
	    res.send("ERROR: Unknown query type.  This should never happen.");
	}
    }

    getLogs(query, returnQuery);
}
router.post('/doQuery', doQuery);

router.post("/uploadLog", upload.single('theFile'), uploadLog);

router.get('/testVis', function(req, res) {
    res.render('visualize', {title: "Query Visualization Test",
			     theData: analyzeSelected()});
});

module.exports = router;
