
//
//
// Alexis Guinebertiere, 2014
// This code is freely distributable.
// This utility does not carry any warranty from Tableau Software to be fit for any purpose.
// Use at your own risk.
//
//

//
// GLOBAL SETTINGS
//

var _scheme = "http://"
var _host = "localhost"
var _port = 80
var _site = "Default"
var _admin = "admin"
var _passwd = "admin"
var _binfolder = "C:\\Program Files\\Tableau\\Tableau Server\\8.2\\bin"

function settings( dictionnary ) {
	for(var attributename in dictionnary) {
		switch( attributename ) {
			case "scheme": _scheme = dictionnary[ "scheme" ]
			case "host": _host = dictionnary[ "host" ]
			case "port": _port = dictionnary[ "port" ]
			case "site": _site = dictionnary[ "site" ]
			case "user": _admin = dictionnary[ "user" ]
			case "passwd": _passwd = dictionnary[ "passwd" ]
			case "binfolder": _binfolder = dictionnary[ "binfolder" ]
		}
	}
}

exports.settings = settings

//
// LIBRARIES
//

var http = require( "http" )
var request = require('request');
var bl = require( "bl" )
var xml2js = require( "xml2js" )
var Q = require( "q" )
var rl = require( "readline" );
// var parser = require( "./grammar")
var parser = require( "./grammar" ).parser
var fs = require( "fs" )
var promptly = require( "promptly" )
var assert = require( "assert" )
var child_process = require('child_process')

//
// GLOBAL VARIABLES
//

var _token = ""
var _sites_by_name = {}
var _site_objects_by_name = {}
var _projects_by_name = {}
var _users_by_name = {}
var _datasources_by_name = {}
var _projects = []
var _frames = []
var _variables = {}
var _parameters = {}

function baseurl() {
	return _scheme + _host + ":" + _port.toString()
}

function dopost( path, message, callback ) {
	var completeUrl = baseurl() + path
	request.post( completeUrl, { body : message, headers : { "X-Tableau-Auth" : _token } }, function( error, response, body ) {
		if( error ) callback( error )
		else callback( null, body )
	})
}

function dodelete( path, message, callback ) {
	var completeUrl = baseurl() + path
	request.del( completeUrl, { body : message, headers : { "X-Tableau-Auth" : _token } }, function( error, response, body ) {
		if( error ) callback( error )
		else callback( null, body )
	})
}

function doget( path, callback ) {
	var completeUrl = baseurl() + path
	var cookie = "workgroup_session_id=" + _token
	request.get( { url : completeUrl, headers : { "X-Tableau-Auth" : _token, "Cookie" : cookie }, encoding: null }, function( error, response, body ) {
		if( error ) callback( error )
		else callback( null, body, response )
	})
}

//
// rest api call: SIGN IN
// returns a promise
//

function signin() {
	var deferred = Q.defer()
	message = "<tsRequest> \
		<credentials name=\"" + _admin + "\" password=\"" + _passwd + "\" > \
			<site contentUrl=\"\" /> \
		</credentials> \
	</tsRequest>"
	dopost( "/api/2.0/auth/signin", message, function( error, body ) {
		xml2js.parseString( body, function( err, result ) {
		    if( !err ) {
		    	_token = result.tsResponse.credentials[ 0 ].$.token
		    	deferred.resolve( _token )
		    }
		})
	} )
	return deferred.promise
}

exports.signin = signin

function createsite( sitename, contenturl, adminmode, userquota, storagequotamb ) {
	//console.log( "Creating site " + sitename )
	var deferred = Q.defer()
	message = "<tsRequest> \
		<site name=\"" + sitename + "\" \
		contentUrl=\"" + contenturl + "\" " + 
		// adminMode=\"" + adminmode + "\" \
		// userQuota=\"" + userquota + "\" \
		// storageQuota=\"" + storagequotamb + "\" \
		// disableSubscriptions=\"false\" /> \
	"/></tsRequest>"
	dopost( "/api/2.0/sites/", message, function( error, body ) {
		//if( error ) console.log( error )
		//console.log( body )
		xml2js.parseString( body, function( err, result ) {
		    if( err ) deferred.reject( "creation unsuccesful" )
		    else {
		    	sites().then( function() { deferred.resolve( "creation succesful" ) } )
		    }
		})
	} )
	return deferred.promise
}

exports.createsite = createsite

function deletesite( sitename ) {
	var siteid = _sites_by_name[ sitename ]
	var deferred = Q.defer()
	dodelete( "/api/2.0/sites/" + siteid, "", function( error, body ) {
		xml2js.parseString( body, function( err, result ) {
		    if( err ) deferred.reject( "deletion unsuccesful" )
		    else {
		    	sites().then( function() { deferred.resolve( "creation succesful" ) } )
		    }
		})
	} )
	return deferred.promise
}

exports.deletesite = deletesite

function createproject( name, description ) {
	var deferred = Q.defer()
	message = "<tsRequest> \
		<project name=\"" + name + "\" \
		description=\"" + description + "\" " + 
		// adminMode=\"" + adminmode + "\" \
		// userQuota=\"" + userquota + "\" \
		// storageQuota=\"" + storagequotamb + "\" \
		// disableSubscriptions=\"false\" /> \
	"/></tsRequest>"
	dopost( "/api/2.0/sites/" + _sites_by_name[ _site ] + "/projects", message, function( error, body ) {
		//if( error ) console.log( error )
		//console.log( body )
		xml2js.parseString( body, function( err, result ) {
		    if( err ) deferred.reject( "creation unsuccesful" )
		    else {
		    	// there is no function yet in the RESTapi to get a list of projects
		    	// projects().then( function() { deferred.resolve( "creation succesful" ) } )
		    	deferred.resolve( "creation succesful" )
		    }
		})
	} )
	return deferred.promise
}

exports.createproject = createproject

function deleteproject( name ) {
	var siteid = _sites_by_name[ sitename ]
	var projectid = _projects_by_name[ name ]
	var deferred = Q.defer()
	dodelete( "/api/2.0/sites/" + siteid + "/projects/" + projectid, "", function( error, body ) {
		xml2js.parseString( body, function( err, result ) {
		    if( err ) deferred.reject( "deletion unsuccesful" )
		    else {
		    	// projects().then( function() { deferred.resolve( "creation succesful" ) } )
		    	deferred.resolve( "creation succesful" )
		    }
		})
	} )
	return deferred.promise
}

exports.deleteproject = deleteproject

function deletetag( workbook_id, tag ) {
	var deferred = Q.defer()
	dodelete( "/api/2.0/sites/" + _sites_by_name[ _site ] + "/workbooks/" + workbook_id + "/tags/" + tag, "", function( error, body ) {
		xml2js.parseString( body, function( err, result ) {
		    if( err ) deferred.reject( "deletion unsuccesful" )
		    else {
		    	deferred.resolve( "deletion succesful" )
		    }
		})
	} )
	return deferred.promise
}

exports.deletetag = deletetag

//
// rest api call: SITES
// returns a promise
//

function sites( add_to_frames ) {
	if( typeof(add_to_frames)==='undefined' ) add_to_frames = true
	var deferred = Q.defer()
	doget( "/api/2.0/sites?includeProjects=true", function( error, body ) {
		try {
			assert( !error )
			xml2js.parseString( body, function( err, result ) {
			    assert( !error )
		    	_sites_by_name = {}
		    	var newframe = { "type" : "sites", "content" : {} }
		    	for( i in result.tsResponse.sites[0].site ) {
		    	 	_sites_by_name[ result.tsResponse.sites[0].site[i].$.name ] = result.tsResponse.sites[0].site[i].$.id
		    	 	_site_objects_by_name[ result.tsResponse.sites[0].site[i].$.name ] = result.tsResponse.sites[0].site[i]
		    	 	if( add_to_frames ) newframe[ "content" ][  result.tsResponse.sites[0].site[i].$.name ] =  result.tsResponse.sites[0].site[i]
		    	}
		    	if( add_to_frames ) _frames.push( newframe )
			})
			deferred.resolve( _sites_by_name )
		}
		catch( error ) { console.log( "Error while fetching sites" ); console.log( error ); process.exit() }
	} )
	return deferred.promise
}

exports.sites = sites

//
//
//
//
//

function projects( add_to_frames ) {
	var deferred = Q.defer()
	if( typeof(add_to_frames)==='undefined' ) add_to_frames = true

	var newframe = { "type" : "projects", "content" : {} }
	_projects_by_name = {}

	// console.log( "Doing the projects thing" )
	try {
		for( i in _site_objects_by_name[ _site ].projects[0].project ) {
		 	_projects_by_name[ _site_objects_by_name[ _site ].projects[0].project[i].$.name ] =_site_objects_by_name[ _site ].projects[0].project[i].$.id
		 	if( add_to_frames ) newframe[ "content" ][ _site_objects_by_name[ _site ].projects[0].project[i].$.name ] =  _site_objects_by_name[ _site ].projects[0].project[i]
		}
		if( add_to_frames ) _frames.push( newframe )
		
	    deferred.resolve( _projects_by_name );
	}
	catch( error ) { console.log( "Error in projects" ); console.log( error ) }
	
	return deferred.promise
}

exports.projects = projects

//
// rest api call: USERS
// returns a promise
//

exports.users = users

function users( add_to_frames ) {
	if( typeof(add_to_frames)==='undefined' ) add_to_frames = true
	var deferred = Q.defer()
	doget( "/api/2.0/sites/" + _sites_by_name[ _site ] + "/users", function( error, body ) {
		try {
			assert( !error, "GET command error" )
			xml2js.parseString( body, function( err, result ) {
			    assert( !err )
		    	_users_by_name = {}
		    	var newframe = { "type" : "users", "content" : {} }
		    	for( i in result.tsResponse.users[0].user ) {
		    	 	_users_by_name[ result.tsResponse.users[0].user[i].$.name ] = result.tsResponse.users[0].user[i].$.id
		    	 	if( add_to_frames ) newframe[ "content" ][ result.tsResponse.users[0].user[i].$.name ] = result.tsResponse.users[0].user[i]
		    	}
		    	if( add_to_frames ) _frames.push( newframe )
			})
			deferred.resolve( _users_by_name )
		}
		catch( error ) { console.log( "Error while fetching users from site \"" + _site + "\"" ); console.log( error ); process.exit() }
	} )
	return deferred.promise
}

//
// rest api call: DATASOURCES
// returns a promise
//

exports.datasources = datasources

function datasources( add_to_frames ) {
	if( typeof(add_to_frames)==='undefined' ) add_to_frames = true
	var deferred = Q.defer()
	doget( "/api/2.0/sites/" + _sites_by_name[ _site ] + "/datasources", function( error, body ) {
		try {
			assert( !error, "Error during GET" )
			xml2js.parseString( body, function( err, result ) {
			    assert( !error, "Error parsing XML" )
		    	_datasources_by_name = {}
		    	var newframe = { "type" : "datasources", "content" : {} }
		    	for( i in result.tsResponse.datasources[0].datasource ) {
		    	 	_datasources_by_name[ result.tsResponse.datasources[0].datasource[i].$.name ] = result.tsResponse.datasources[0].datasource[i].$.id
		    	 	if( add_to_frames ) newframe[ "content" ][ result.tsResponse.datasources[0].datasource[i].$.name ] = result.tsResponse.datasources[0].datasource[i]
		    	}
		    	if( add_to_frames ) _frames.push( newframe )
			})
			deferred.resolve( _datasources_by_name )
		}
		catch( error ) { console.log( "Error while fetching datasources from site \"" + _site + "\"" ); console.log( error ); process.exit() }
	} )
	return deferred.promise
}

//
// rest api call: DATASOURCE
// returns a promise
//

function datasource( datasource ) {
	var deferred = Q.defer()
	doget( "/api/2.0/sites/" + _sites_by_name[ _site ] + "/datasources/" + _datasources_by_name[ datasource ], function( error, body ) {
		try {
			assert( !error, "Error during GET" )
			xml2js.parseString( body, function( err, result ) {
			    assert( !err )
		    	console.log( "ID=" + result.tsResponse.datasource[0].$.id )
		    	console.log( "NAME=" + result.tsResponse.datasource[0].$.name )
		    	console.log( "TYPE=" + result.tsResponse.datasource[0].$.type )
		    	console.log( "PROJECT=" + result.tsResponse.datasource[0].project[0].$.name )
		    	// console.log( result.tsResponse.datasource[0].tags )
	    		for( i=0; i < result.tsResponse.datasource[0].tags.length; i++ ) {
	    			if( result.tsResponse.datasource[0].tags[i].tag )
	    				console.log( "TAG=" + result.tsResponse.datasource[0].tags[i].tag[0].$.label )
		    	}
		    	deferred.resolve( result )
			})
		} catch( error ) { console.log( "Error while fetching datasource \"" + _datasources_by_name[ datasource ] + "\" from site \"" + _site + "\"" ); console.log( error ); process.exit() }
	} )
	return deferred.promise
}

exports.datasource = datasource

//
// rest api call: WORKBOOKS
// returns a promise
//

function workbooks( user, add_to_frames ) {
	if( typeof(add_to_frames)==='undefined' ) add_to_frames = true
	var deferred = Q.defer()
	// console.log( "Looking for workbooks for " + user )
	doget( "/api/2.0/sites/" + _sites_by_name[ _site ] + "/users/" + _users_by_name[ user ] + "/workbooks", function( error, body ) {
		try {
			assert( !error, "Error during GET" )
			xml2js.parseString( body, function( err, result ) {
			    assert( !error, "Error parsing XML" )
			    assert( typeof( result.tsResponse.error ) === 'undefined', "Error: " + result.tsResponse.error )
		    	_datasources_by_name = {}
		    	var newframe = { "type" : "workbooks", "content" : {} }
		    	for( i in result.tsResponse.workbooks[0].workbook ) {
		    	 	if( add_to_frames ) newframe[ "content" ][ result.tsResponse.workbooks[0].workbook[i].$.name ] = result.tsResponse.workbooks[0].workbook[i]
		    	}
		    	if( add_to_frames ) _frames.push( newframe )
			})
			deferred.resolve( "done" )
		}
		catch( error ) { console.log( "Error while fetching workbooks from site \"" + _site + "\"" ); console.log( error ); process.exit() }
	} )
	return deferred.promise
}

exports.workbooks = workbooks


function filter( variable, framecommand, jscode ) {
	try {
		var framenumber = framecommand[ "frame" ]
    	if( framecommand[ "command" ] == "pastframe" ) framenumber = _frames.length - framecommand[ "frame" ] - 1
    	var frame = _frames[framenumber]
    	if( framecommand[ "variable" ] ) frame = _variables[ framecommand[ "variable" ] ]

		var newframe = { "type": frame[ "type" ], "content": [] }
		for( elemindex in frame[ "content" ] ) {
			elem = frame[ "content" ][ elemindex ]
			_variables[ variable ] = frame["content"][elemindex]
			try {
				//console.log( "Processing value" )
				//console.log( processValue( jscode ) )
				if( processValue( jscode ) ) newframe[ "content" ][ elem.$.name ] = elem
			}
			catch( error ) { console.log( error ) }
		}
		_frames.push( newframe )
	} catch( error ) { console.log( "Error while processing filter" ); console.log( error ); process.exit() }
}

function collect( variable, framecommand, jscode ) {
	try {
		var framenumber = framecommand[ "frame" ]
    	if( framecommand[ "command" ] == "pastframe" ) framenumber = _frames.length - framecommand[ "frame" ] - 1
    	var frame = _frames[framenumber]
    	if( framecommand[ "variable" ] ) frame = _variables[ framecommand[ "variable" ] ]
		var newframe = { "type": "collection", "content": [] }
		for( elemindex in frame[ "content" ] ) {
			elem = frame[ "content" ][ elemindex ]
			_variables[ variable ] = frame["content"][elemindex]
			try {
				newframe[ "content" ][ processValue( jscode ) ] = processValue( jscode )
			}
			catch( error ) { console.log( error ) }
		}
		_frames.push( newframe )
	} catch( error ) { console.log( "Error while processing collect" ); console.log( error ); process.exit() }
}

//
// Initialization sequence
//

function done() {
	process.exit();
}

function nextcommandstring() { return ""
+ _frames.length + " frames - type 'help' for help" }

function helpstring() { return "\
MENU\n\
====\n\
help ................... Help (this screen)\n\
sites................... List of Sites\n\
use [newsite] .......... Use Site [" + _site + "]\n\
users .................. List of Users\n\
datasources ............ List of Datasources\n\
datasource [ds]......... Read Datasource\n\
workbooks [user]........ List Workbooks for user\n\
frames ................. List data frames\n\
exit ................... Exit" }

process.stdin.resume();
process.stdin.setEncoding('utf8');

function ask(question, callback) {
  var r = rl.createInterface({
    input: process.stdin,
    output: process.stdout})
  r.question( question, function(answer) {
    r.close();
    callback( answer );
  })
}

// make a simple deferred/promise out of the prompt function
var prompter = function(text,options,callback) {
    var deferred = Q.defer();
    promptly.prompt(text, options, function(err, value) {
    	if( err ) console.log( err );
    	callback( value );
       	deferred.resolve(value);
    });
    return deferred.promise;
};

function DumpObjectIndented(obj, indent)
{
  var result = "";
  if (indent == null) indent = "";

  for (var property in obj)
  {
    var value = obj[property];
    if (typeof value == 'string')
      value = "'" + value + "'";
    else if (typeof value == 'object')
    {
      if (value instanceof Array)
      {
        value = "[ " + value + " ]";
      }
      else
      {
        var od = DumpObjectIndented(value, indent + "  ");
        value = "\n" + indent + "{\n" + od + "\n" + indent + "}";
      }
    }
    result += indent + "'" + property + "' : " + value + ",\n";
  }
  return result.replace(/,\n$/, "");
}

function printFrame( i ) {
	console.log( "#" + i + " #-" + (_frames.length-i-1) + " " + Object.keys( _frames[i]["content"] ).length + " " + _frames[i]["type"] )
	k = 1
	for( j in _frames[i]["content"] ) {
		console.log( k + "> " + j )
		k++
	}
}

function printElement( i, j ) {
	console.log( DumpObjectIndented( _frames[i]["content"][ Object.keys( _frames[i]["content"] )[j-1] ], "" ) + "\n" )
}

function processValue( parsed ) {
	var vars = _variables
	for( v in _variables ) {
		// console.log( "var " + v + " = " + JSON.stringify(_variables[v], null, 4) )
		eval( "var $" + v + " = " + JSON.stringify(_variables[v], null, 4) )
	}
	for( v in _parameters ) {
		// console.log( "var " + v + " = " + JSON.stringify(_variables[v], null, 4) )
		eval( "var $" + v + " = " + JSON.stringify(_parameters[v], null, 4) )
	}
	if( parsed[ "value" ] == "string" ) return parsed[ "literal" ]
	else if( parsed[ "value" ] == "argument" ) return _parameters[ parsed[ "argument" ] ]
	else if( parsed[ "command" ] == "element" ) {
		console.log( "Evaluating element" )
		var framenumber = parsed[ "framecommand" ][ "frame" ]
	    if( parsed[ "framecommand" ][ "command" ] == "pastframe" ) framenumber = _frames.length - parsed[ "framecommand" ][ "frame" ] - 1
		return _frames[ framenumber ][ "content" ][ Object.keys( _frames[framenumber]["content"] )[ parsed[ "index" ] -1] ]
	}
	else if( parsed[ "value" ] == "variable" ) return _variables[ parsed[ "variable" ] ]
	else if( parsed[ "command" ] == "javascript" ) { return eval( parsed[ "code" ] ) }
	else if( parsed[ "command" ] == "parameter" ) { return _parameters[ parsed[ "parameter" ] ] }
}

//
//	PROCESS COMMANDS
//

function processCommand( parsed, interactive ) {
	// console.log( parsed )
	if( typeof(interactive)==='undefined' ) interactive = false
	var deferred = Q.defer()
	try {
		// console.log( parsed )
		if( parsed[ "command" ] == "LU" ) {
	    	return users().then( function () {
	    		if( interactive ) return processCommand( { "command" : "pastframe", "frame": 0 } )
			})
	    }
		else if( parsed[ "command" ] == "LD" ) {
			return datasources().then( function( result ) {
				if( interactive ) return processCommand( { "command" : "pastframe", "frame": 0 } )
	    	} )
	    }
	    else if( parsed[ "command" ] == "LP" ) {
			return projects().then( function( result ) {
				if( interactive ) return processCommand( { "command" : "pastframe", "frame": 0 } )
	    	} )
	    }
		else if( parsed[ "command" ] == "LS" ) {
			return sites().then( function() {
				// if we are in interactive mode, we display these sites now
				if( interactive ) return processCommand( { "command" : "pastframe", "frame": 0 } )
	    	} )
	    }
		else if( parsed[ "command" ] == "CS" ) {
			_site = processValue( parsed[ "site" ] )
			return users().then( datasources )
	    }
	    else if( parsed[ "command" ] == "createsite" ) {
	    	var site = processValue( parsed[ "site" ] )
	    	return createsite( site, site )
	    }
	    else if( parsed[ "command" ] == "deletesite" ) {
	    	var site = processValue( parsed[ "site" ] )
	    	return deletesite( site, site )
	    }
	    else if( parsed[ "command" ] == "createproject" ) {
	    	var name = processValue( parsed[ "name" ] )
	    	var description = processValue( parsed[ "description" ] )
	    	return createproject( name, description )
	    }
	    else if( parsed[ "command" ] == "deleteproject" ) {
	    	var name = processValue( parsed[ "name" ] )
	    	return deleteproject( name )
	    }
	    else if( parsed[ "command" ] == "deletetag" ) {
	    	var workbook_id = processValue( parsed[ "workbook_id" ] )
	    	var tag = processValue( parsed[ "tag" ] )
	    	return deletetag( workbook_id, tag )
	    }
	    else if( parsed[ "command" ] == "WORKBOOKS" ) {
	    	var user = processValue( parsed[ "user" ] )
	    	return workbooks( user ).then( function() {
				// if we are in interactive mode, we display these sites now
				if( interactive ) return processCommand( { "command" : "pastframe", "frame": 0 } )
	    	} )
	    }
	    else if( parsed[ "command" ] == "RDS" ) {
			datasource_name = parsed[ "datasource" ]
	    	return datasource( datasource_name )
	    }
	    else if( parsed[ "command" ] == "F" ) {
			for( i in _frames ) {
				console.log( "#" + i + " #-" + (_frames.length-i-1) + " " + Object.keys( _frames[i]["content"] ).length + " " + _frames[i]["type"] )
			}
			deferred.resolve( "done printing frame" )
	    }
	    else if( parsed[ "command" ] == "H" ) {
			console.log( helpstring() )
			deferred.resolve( "done printing help" )
	    }
	    else if( parsed[ "command" ] == "use" ) {
			_site = processValue( parsed[ "site" ] )
			var r = Q(0);
			r = r.then( users )
			r = r.then( datasources )
			r = r.then( projects )
			return r
	    }
	    else if( parsed[ "command" ] == "print" ) {
	    	var value = processValue( parsed[ "value" ] )
	    	console.log( value )
	    	deferred.resolve( "done printing" )
	    }
	    else if( parsed[ "command" ] == "frame" ) {
	    	printFrame( parsed[ "frame" ] )
	    	deferred.resolve( "done printing frame" )
	    }
	     else if( parsed[ "command" ] == "pastframe" ) {
	    	printFrame( _frames.length - parsed[ "frame" ] - 1 )
	    	deferred.resolve( "done printing frame" )
	    }
	    else if( parsed["command"] == "download" ) {
	    	var value = urlify( processValue( parsed[ "value" ] ) )
	    	var relativeurl = "/workbooks/" + value + "?format=twb"
	    	if( _site != "Default" ) relativeurl = "/t/" + _site + "/workbooks/" + value + "?format=twb"
	    	
	    	doget( relativeurl, function( error, body, response ) {
	    		if( error ) {
	    			deferred.fail( "error downloading" )
	    		}
	    		else
	    		{
	    			var filename = response.headers[ "content-disposition" ].replace( "attachment; filename=\"", "" )
	    			filename = fileify( filename.substring( 0, filename.length - 1 ) )
	    			fs.writeFile( "content/" + filename, body, function(err) {
					    if(err) {
					        console.log(err);
					    } else {
					    	console.log( "Downloaded " + relativeurl )
					        deferred.resolve( "done downloading" )
					    }
					});
	    		}
	    		
	    	} )
	    }
	    else if( parsed[ "command" ] == "publishworkbook" ) {
	    	var wb = processValue( parsed[ "workbook" ] )
	    	console.log( "Publishing " + wb )
	    	var filecommand = _binfolder + "\\tabcmd.exe"
	    	var arguments = [ "publish", "content\\" + fileify( wb ) + ".twbx", "-t", _site, "--overwrite", "-s", baseurl(), "-u", _admin, "-p", _passwd ]
	    	var publichprocess = child_process.execFile( filecommand, arguments, [], function( error, stdout, stderr ) {
	    		console.log('stdout: ' + stdout);
			    console.log('stderr: ' + stderr);
			    if (error !== null) {
			      console.log('exec error: ' + error);
			    }
	    		console.log( "done with publishing " + wb )
	    		deferred.resolve( "done publishing" )
	    	} )
	    }
	    else if( parsed[ "command" ] == "loop" ) {
	    	var framenumber = parsed[ "framecommand" ][ "frame" ]
	    	if( parsed[ "framecommand" ][ "command" ] == "pastframe" ) framenumber = _frames.length - parsed[ "framecommand" ][ "frame" ] - 1
	    	var frame = _frames[framenumber]
	    	if( parsed[ "framecommand" ][ "variable" ] ) frame = _variables[ parsed[ "framecommand" ][ "variable" ] ]
	    	var r = Q(0);
	    	for( i in frame["content"] )( function(i) {
	    		r = r.then( function() {
	    			// console.log( "with i=" + i + ", " + parsed[ "variable" ] + "=" )
					// console.log( _frames[framenumber]["content"][i] )
					var s = Q(0);
		    		_variables[ parsed[ "variable" ] ] = frame["content"][i]
		    		for( c in parsed[ "commands" ] )( function(c) {
		    			s = s.then( function() {
		    				if( parsed[ "value" ] ) console.log( processValue( parsed ) )
		    				else return processCommand( parsed[ "commands" ][c] ) } )
		    		})(c)
		    		return s
	    		})
    		})(i)
    		return r
	    }
	    else if( parsed[ "command" ] == "filter" ) {
	    	return filter( parsed[ "variable" ], parsed[ "framecommand" ], parsed[ "javascript" ] )
	    }
	    else if( parsed[ "command" ] == "collect" ) {
	    	return collect( parsed[ "variable" ], parsed[ "framecommand" ], parsed[ "javascript" ] )
	    }
	    else if( parsed[ "command" ] == "javascript" ) {
	    	// setting local variables
	    	for( v in _variables ) {
				eval( "var $" + v + " = " + JSON.stringify(_variables[v], null, 4) )
			}
			for( v in _parameters ) {
				eval( "var $" + v + " = " + JSON.stringify(_parameters[v], null, 4) )
			}
	    	eval( parsed[ "code" ] );
	    	deferred.resolve( "done with javascript" )
	    }
	    else if( parsed[ "value" ] ) {
	    	console.log( JSON.stringify( processValue( parsed ), null, 4 ) )
	    	deferred.resolve( "done with value" )
	    }
	    else if( parsed[ "command" ] == "assign" ) {
	    	var r = Q(0);

	    	r = r.then( function() { return processCommand( parsed[ "listcommand" ] ) } )
	    	.then( function() { _variables[ parsed[ "variable" ] ] = _frames[ _frames.length - 1 ] } )

	    	return r
	    }
	    else if( parsed[ "parameter" ] ) {
	    	deferred.resolve( "passing parameter" )
	    }
	    else if( parsed[ "command" ] == "X" ) done()
	} catch( err ) { console.log( err ) }
	
	return deferred.promise
}

function nextcommand() {
	console.log( nextcommandstring() )
	console.log( "" )
	ask( "> ", function( result ) {
		try {
			var parsed = parser.parse( result )
			// console.log( parsed )
			var q = Q(0);
			for( i in parsed )( function( i ) {
				q = q.then( function() { return processCommand( parsed[i], true ) } )
			})(i)
			q.then( function() { nextcommand() } )
			return q
		}
		catch( err ) { console.log( err ); nextcommand() } 
	})
}

function interactiveloop() {
	console.log( "We're setting parameters" )
	// setting parameters
	for( a=2; a<=process.argv.length; a++ ) _parameters[ a-1 ] = process.argv[a]

	console.log( "\n\
#####  ##  ###  ###   ##  #####\n\
  #   #  # #  # #  # #  #   #\n\
  #   #### ###  ###  ####   #\n\
  #   #  # #  # #  # #  #   #\n\
  #   #  # ###  #  # #  #   #\n\
" )
	console.log( "TABleau Rest Api Tool" )
	nextcommand()
}

function findFirstProperty( obj, attribute )
{
    for (var k in obj)
    {
        if (typeof obj[k] == "object" && obj[k] !== null) {
            var foo = findProperty(obj[k], attribute) 
            if( foo ) return foo
        }
        else if( k == attribute ) return obj[k]
    }
	return undefined
}

function findAnyProperty( obj, attribute, value )
{
    for (var k in obj)
    {
        if (typeof obj[k] == "object" && obj[k] !== null) {
            var foo = findAnyProperty(obj[k], attribute, value ) 
            if( foo ) return foo
        }
        else if( k == attribute && obj[k] == value ) return true
    }
	return undefined
}

function urlify( name ) {
	return name.replace( / /g, '' ).replace( /\//g, '' ).replace( /\?/g, '' ).replace( /\./g, '_' )
}

function fileify( name ) {
	return name.replace( /\//g, '-' ).replace( /\?/g, '-' )
}

if( require.main === module ) {
	signin()
	.then( function( newtoken ) {
		return sites()
	} )
	.then( function( result ) {
		//console.log( "Read " + Object.keys( result ).length + " sites" )
		return users()
	})
	.then( function( result ) {
		//console.log( "Read " + Object.keys( result ).length + " users" )
		return datasources()
	})
	.then( function( result ) {
		//console.log( "Read " + Object.keys( result ).length + " users" )
		return projects()
	})
	.then( function( result ) {
		//console.log( "Read " + Object.keys( result ).length + " datasources" )

		if( process.argv[2] ) {
			fs.exists( process.argv[2], function( exists ) {
				if( exists ) {

					// console.log( "File exists..." )

					// setting parameters
					for( a=3; a<=process.argv.length; a++ ) _parameters[ a-2 ] = process.argv[a]

					var stream = fs.createReadStream( process.argv[2] )
					stream.pipe( bl( function( err, data ) {
						var script = data.toString()
						try {
							// console.log( "Parsing file...")
							var parsed = parser.parse( script )
							// console.log( parsed )

							// now prompting for missing parameters
							var parameters = parsed.filter( function( elem ) { return !( typeof( elem[ "parameter" ] ) === 'undefined' ) } )			
							var commands = parsed.filter( function( elem ) { return ( typeof( elem[ "parameter" ] ) === 'undefined' ) } )

							// console.log( commands )		

							var q = Q(0);

							for( i in parameters ) ( function(i) {
								var knownval = _parameters[ parameters[i][ "parameter" ] ]
								if( typeof( knownval ) === 'undefined' ) {

									q = q.then( function() {
										return prompter( parameters[i][ "question" ] + " (" + parameters[i][ "default" ] + ") >", { "default" : parameters[i][ "default" ] }, function( result ) {
											if( result === '' ) _parameters[ parameters[i][ "parameter" ] ] = parameters[i][ "default" ]
											else  _parameters[ parameters[i][ "parameter" ] ] = result
										} )
									} )
								}
							})(i)

							for( i in commands )( function( i ) {
								q = q.then( function() { return processCommand( commands[i] ) } )
							})(i)

							q.then( function() { done() } )
							return q
						}
						catch( err ) { console.log( err ) } 
					}))
				}
				else
				{
					interactiveloop()
				}
			} )
		}
		else
		{
			interactiveloop()
		}
	})
}