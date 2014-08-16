Software Development Lifecycle With Tableau
=========

A sample which demonstrates the process of provisioning new multi-tenant sites and populating them with site-specific users and customized-per-site Tableau workbooks. These techniques are the same one would use to publish / promote reports from / to  Dev/Test/Prod

  - Reading 
  - Pulling "template" reports from a source control system
  

 
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


Tableau Server Configuration
----

Ricense
----

MIT


**Free Software, Hell Yeah!**

FAQ
----




[PhantomJS]:http://phantomjs.org
[Node.js]:http://nodejs.org/
[Darth FlashyPants]:http://twitter.com/lordflashypants
[documentation]:http://onlinehelp.tableausoftware.com/current/server/en-us/help.htm#trusted_auth_trustIP.htm

