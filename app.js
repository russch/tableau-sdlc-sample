//setup environment
process.env.NODE_ENV = "default";
process.env.NODE_CONFIG_DIR = "config";

//modules ==========================================





// Modules used for uploading files, writing to the file system, and publishing to Tableau
var exec = require('exec');
var config = require('config');
var github = require('octonode');
var request = require("request");
var fs = require('fs');
var Q = require( "q" );

// tabrat reference
var tabrat = require( "./tabrat" );

//location of the git repo
var appConfig = config.get('ServerInfo');
var githubURI = appConfig.get('ServerConfig.gitRepo'); 

// Sites to be created
var _sites = config.get('Sites');
var _sitesQueue = _sites; // Queue of sites we'll process by popping values out of the array as they are created

console.log("Count of sites to provision: " + _sites.length.toString());



// Before we do anything, let's attempt to keep phantomJS instances from hanging around
// It seems they don't always go away gracefully. 
process.on('exit', function(code, signal) {
    console.log("Cleaning up temp files and exiting.");
    //Cleanup logic here
});


var client = github.client();
var reports = [];

// assign tabrat settings
settings = {
	"host" : "winTableau",
	"port" : 80,
	"scheme" : "http://",
	"site" : "Default",
	"user" : "admin",
	"passwd" : "adminpw",
	"binfolder" : "C:\\Program Files\\Tableau\\Tableau Server\\8.2\\bin"
};
tabrat.settings( settings );


//  BEGIN HERE: signin
tabrat.signin().then( function( token ) {
	console.log("Logged in: ", token);
    // create sites
    processSites();
  });  
    

function processSites() {
    // Keep calling myself until queue of sites to be created is exhausted

    if (_sitesQueue.length > 0) {
        var site = _sitesQueue[0];
        _sitesQueue.splice(0, 1);
        createSite(site, processSites);
    } else {
        console.log("All sites created."); 
        // Get all sites on server to extract LUID for newly created sites.
       // tabrat.sites().then (function (updatedSites) {
            //console.log(updatedSites);
    //    });
    }

}




// Helper Functions

var getReports = function ()
{
    // What reports need to be brought down locally?
    client.get('/repos/russch/tableau-sdlc-sample/contents/reports', {}, function (err, status, body, headers) {
        reports = body;
        // request each file and save locally
        console.log("Reports to process: ", reports.length);
        for (report in reports) {
            (function (report) 
                {
                    var reportName = githubURI + report.name.toString(); 
                    console.log(reportName); 
                    request(
                    {
                        url: reportName
                    },
                        function (err, response, body) {
                            console.log("Request Callback", reportName);
                            if (err) {
                                console.log(response);
                                return;
                            } else {
                                fs.writeFile('./downloaded-reports/' + report.name.toString(), body, function (err) {
                                              if (err) console.log(err);
                                              console.log("File " + report.name.toString() + " saved.");
                                            });
                            }
                        }
                    );

                }) (reports[report]);
        }
    });
}

        
                // print sites
               /* tabrat.sites().then (function (sites) {
                    console.log(sites);
                });*/




function createSite(site, callback) {
    tabrat.createsite(site.siteName, site.siteId).then ( 
        function (luid) {
        console.log (site.siteName + ": " + luid);
        // save site luid for later
        injectSiteLuid(site.siteName, luid);    
        // back to processSites()
        return callback(null);
        }, 
            function (error) {
                console.log(error);
                return callback (null);
            }
                                                       
   );
}

function injectSiteLuid(siteName, luid)
{
    console.log("in", siteName, luid);
    for (key in _sites) 
    {
        if(_sites[key].siteName == siteName) {
            _sites[key].siteLuid = luid;
            
        }
        else{console.log("no");}
            
    }
    console.log(_sites);
    return null;
    
}

