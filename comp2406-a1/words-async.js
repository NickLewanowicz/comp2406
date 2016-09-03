// simplegrep_async.js
//
// duplicates the base functionality of the UNIX grep command
// This version uses asynchronous I/O.
//

var fs = require('fs');

if (process.argv.length < 3) {
    console.error('Not enough parameters given. Try this: ' +
                  '"node async inputname.txt outputname.txt"'); 
    process.exit(1);
}

//Arguments are input and output
var input = process.argv[2];
var output = process.argv[3];

var returnMatches = function(err, rawContents) {

    var words = rawContents.split(/[\W]/);
	var wordsOut = [];
	var flag = false;
	
    words.forEach(function(theLine) {
		for (i = 0; i < words.length; i++) {
			for (j=0 ; j < wordsOut.length ; j++){
				if (wordsOut[j].localeCompare(words[i]) === 0 || words[i] === ""){
					flag = true;
				}
			}
			if (flag === false){
				wordsOut.push(words[i]);
			}else{
				flag = false;
			}
		}
	
    });
    wordsOut.sort();
	console.log("Parseing Complete...");
	var final = '';

	for (i = 0;i < wordsOut.length;i++){
			final += wordsOut[i] + '\n';
	}

	final = final.substring(0, final.length-1);
	fs.writeFile(output,final);
    console.log("Actually Done!");
}

fs.readFile(input, 'utf-8', returnMatches);

console.log("Not Done!");
