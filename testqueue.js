var queue = require('queue');
var fs = require('fs');

var q = queue();
var results = [];
var sites= []
var foobar = [{user: "./users/blueUsers.txt", site: "blueCorp"}, {user: "./users/redUsers.txt", site: "redCorp"}];

for(key in foobar)
{
    (function(filename, site) {
    
        q.push(function(cb) { 

            administerUsers (filename, site, function (err, array) {
            console.log(array);
                cb();
            });
        });
    
    })(foobar[key].user, foobar[key].site);
}

var administerUsers = function(file, site, callback)
{
    fs.readFile(file, function(err, data) {
        if(err) throw err;
        var array = [{site:site}];
        array.push( data.toString().split("\n"));
        callback( null, array);
    });
}



q.on('success', function(result, job) {
  //console.log('job finished processing:', job.toString().replace(/\n/g, ''));
});

// begin processing, get notified on end / failure

q.start(function(err) {
  console.log('all done:', foobar);
});
