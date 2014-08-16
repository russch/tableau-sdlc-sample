//setup environment
process.env.NODE_ENV = "default";
process.env.NODE_CONFIG_DIR = "config";

//modules ==========================================





// Modules used for uploading files, writing to the file system, and publishing to Tableau
var exec = require('exec');
var config = require('config');


//location of the git repo
tableau = config.get('ServerInfo');
var gitHub = tableau.get('ServerConfig.gitRepo'); 

// Info about reports
var sites = config.get('Sites');
console.log("Count of sites to provision: " + sites.length.toString());

// Array of URLs complete w/ Trusted Ticket included
var urls = [];


// Before we do anything, let's attempt to keep phantomJS instances from hanging around
// It seems they don't always go away gracefully. 
process.on('exit', function(code, signal) {
    console.log("Cleaning up temp files and exiting.");
    //Cleanup logic here
});


