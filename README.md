Software Development Lifecycle With Tableau
=========

An unsupported sample which demonstrates the process of provisioning new multi-tenant sites and populating them with site-specific users and customized-per-site Tableau workbooks. These techniques are the same one would use to publish / promote reports from / to  Dev/Test/Prod

This is a node.js app which: 

  - Reads config files to create sites and users on the server & site of your choice
  - Pulls "template" reports from a source control system (github)
  - Updates each "template" report with site-specific information specified in the config file
  - Publishes each set of template reports to individual sites and servers
  

 
Version
----

1.0



Installation
--------------
Windows only - Uses TabCmd, which currently is only supported on Windows. 

 - To begin, you must download and install [Node.Js] for Windows
 - Unzip to the folder of your choice, and navigate there on the command-line
 - Execute these commands to prepare the app
 
```sh
npm install 
```


To run the app on Windows:

```sh
node app
```
Script Configuration
-----------

Modify these settings in **\config\default.json**:


#### ServerInfo section

 - The location of the "raw" github repo and folder which contains reports you wish to publish
 
#### Sites section
 - **server**: the hostname of your Tableau server
 - **protocol**: will we connect over http or https?
 - **siteName**: The "friendly" name of the site to be created
 - **siteId**: The "internal" ID of this site
 - **database**: The database name to which reports in this site connect to. It is common to partition user data by customer in a multi-tenant scenario
 - **user** Pointer to a text file which contains users who should be loaded into this site. 

Tableau Server Configuration
----

License
----

MIT


**Free Software, Hell Yeah!**

Notes
----
Node is not the best tool for this sort of a demo. There, I said it. It can be difficult to force synchronous behavior on a platform that is made to live in an asynchronous world. The result is that some of the code here is overly complex. Sorry.

 - This code is not even close to being production-ready. Don't. Go. There.
 - Script assumes that none of the sites and/or users have been created on the server. 
 - Script assumes that reports are connecting to SQL Server and use Windows auth. If you do things differently, you'll need to play with the tabCmdPublish() method and add/use the --db-username, --db-password, and potentially the --db-savepassword options.




[Node.js]:http://nodejs.org/


