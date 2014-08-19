//setup environment
process.env.NODE_ENV = "default";
process.env.NODE_CONFIG_DIR = "config";


// ============== Modules 
var exec = require('exec');
var config = require('config');
var github = require('octonode');
var request = require("request");
var fs = require('fs');
var Q = require( "q" );
var queue = require('queue');
var jsxml = require("node-jsxml");
// tabrat reference
var tabrat = require( "./tabrat" );

// Before we do anything, let's attempt to exit gracefully when necessary.
process.on('exit', function(code, signal) {
    console.log("Cleaning up temp files and exiting.");
    //Cleanup logic here
/*    fs.readdir("./downloaded-reports/", function (err, files) {
        console.log(files);
        if(err) throw err;
        files.forEach(function(file) {
            console.log(path+file);
            fs.unlinkSync(path+file, function(err, stats) {
                console.log(stats);
            });
        });
    });*/
});

//location of the git repo
var appConfig = config.get('ServerInfo');
var githubURI = appConfig.get('ServerConfig.gitRepo'); 

                
// Sites to be created
var _sites = config.get('Sites');
var _sitesQueue = JSON.parse( JSON.stringify( _sites) ); // Queue of sites we'll process by popping values out of the array as they are created
 

// Github - pull reports down to the local machine for modification
var client = github.client();

// load user lists for each site so we can add them once sites are created
var users = [];

// used for queing jobs
var q = queue();

// assign initial tabrat settings
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

// ====================== Logic

// Start downloading reports from Github so they're ready to modify
//getReports();


setTimeout(function(){parseReports();},1000);

//  Syncronous stuff begins HERE: signin, then process sites and users
/*tabrat.signin().then( function( token ) {
	console.log("Logged in: ", token);
    // create sites
    processSites();
  });  */
    

function processSites() {
    // Keep calling myself until queue of sites to be created is exhausted

    if (_sitesQueue.length > 0) {
        var site = _sitesQueue[0];
        _sitesQueue.splice(0, 1);
        createSite(site, processSites);
    } else {
        console.log("All sites created."); 

        // begin adding users to each site by using a queue.
        // Forced to use an immediate function to scope the siteLuid/siteName/user variables correctly: http://stackoverflow.com/questions/13221769/node-js-how-to-pass-variables-to-asynchronous-callbacks

        // Loop throuh each site
        for (key in _sites) {
            // user list, site name and site ID to work through
            (function (filename, site, siteLuid) {
                     
                    // Get array of users to process from the filename
                    administerUsers(filename, site, function (err, usersToProcess) {
                        var userList = usersToProcess;
                        // Login to the site we need to add users to
                        var settings = {
                                "host" : "winTableau",
                                "port" : 80,
                                "scheme" : "http://",
                                "site" : site,
                                "user" : "admin",
                                "passwd" : "adminpw",
                                "binfolder" : "C:\\Program Files\\Tableau\\Tableau Server\\8.2\\bin"
                        };
                        tabrat.settings( settings );
                        tabrat.signin().then (function (sitetoken) {  
                            for (var i=0; i < userList.length; i++) {      
                                (function (user, site, siteLuid) {
                                        q.push(function (cb) {
                                            tabrat.createuser(user, siteLuid).then( function(result) {
                                                console.log("Created User: " + result);
                                                cb();
                                            });
                                         });
                                   }) (userList[i], site, siteLuid, i);
                               // Begin processing queue as soon as there's stuff in it. 
                               // We'll add additional jobs from other sites as the queue drains
                               if (q.length == userList.length) startQueue()     
                            } 
                        }); 
                    });

            })(_sites[key].users, _sites[key].siteName, _sites[key].siteLuid);

        }

                  
    }

}

// ================== Helper Functions

function getReports  ()
{
    // Will contain an array representing reports to be pulled from Github and saved locally
    var reports = [];   
    
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

function parseReports() {
    
    //Begin by making storage dirs in ./updated-reports for each site
     for (key in _sites){
        // Let's just do this synchronously for a chance 
        try {
            fs.mkdirSync("./updated-reports/" + _sites[key].siteName);
        }
         catch (err) {
            console.log(err);
         }
     }
        
    
    // For each site, load reports, switch data sources, then write them out. 
    
       loadReports( function(err, data) {   
           for (site in _sites) {
                (function (site) {      

                    for (key in data){
                        var reportXML = new jsxml.XML(data[key].XML);
                        var datasource = reportXML.child('datasources').child('datasource').child('connection').attribute("dbname");
                        console.log("Report name: " + data[key].report + " Original DB Name: " + JSON.stringify(datasource.toString(),null, 2));
                        datasource.setValue(site.database);
                        console.log ("Report name: " + data[key].report + " Updated DB Name: " + JSON.stringify(datasource.toString(),null, 2));
                        //write file to correct folder
                        try
                        {fs.writeFileSync("./updated-reports/" + site.siteName + "/" +data[key].report, reportXML.toXMLString())}
                        catch(err){console.log(err);}
                        console.log(data[key].report + " written.");
                    }          
                }) (_sites[site]); 
           }
       });
}

function loadReports (callback) {
    var path = "./downloaded-reports/";
    var reports = [];

    
    fs.readdir(path, function (err, files) {
        if(err) throw err;
        files.forEach(function(file) {
            fs.readFile(path+file, function(err, data) {
            if (err) throw err;    
            reports.push({ report: file, XML: data.toString()});    
            // Callback when all files processed  
            if  (files.length == reports.length) callback(err, reports);
            });  
        });
    });

}

function createSite(site, callback) 
{
    // tell Tableau to create a site
    tabrat.createsite(site.siteName, site.siteId).then ( 
        function (luid) {
        console.log ("Site Created: " + site.siteName + " -  " + luid);
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
   
    // Record the new site Luid associated with the sites that have been created
    for (key in _sites) 
    {
        if(_sites[key].siteName == siteName) {
            _sites[key].siteLuid = luid;            
        }   
    }
    
}

// take a username file and sitename and create an array of users that need to be loaded for the site
var administerUsers = function(file, site, callback)
{
    fs.readFile(file, function(err, data) {
        if(err) throw err;
        var array = data.toString().split("\n");
        callback( null, array);
    });
}

var startQueue = function () {
    
        q.start(function(err) {
            tabrat.signout().then( function (){
                console.log("logged out of Tableau");
                console.log('All users created.');
                process.exit(); 
            });
        });
}

// recursively delete directory

    rmDir = function(dirPath) {
      try { var files = fs.readdirSync(dirPath); }
      catch(e) { return; }
      if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
          var filePath = dirPath + '/' + files[i];
          if (fs.statSync(filePath).isFile())
            fs.unlinkSync(filePath);
          else
            rmDir(filePath);
        }
      fs.rmdirSync(dirPath);
    };