A Sith's Tableau Cache Warmer
=========

A completely unsupported app which will warm your Tableau VizQL Server processes.

  - Exercises 1-X different reports on your server
  - Repeats report execution on a user-defined interval 
  - Executes multiple requests for the same report in an attempt to populate caches across all processes

A Sith's Cache Warmer simply calls reports you specify on a regular basis. Doing so over time (generally) will populate the cache of each VizQL on your Tableau Server, increasing the perceived performance of Tableau Server for your users.  It is a Node.JS module that utilizes [PhantomJS] as a headless browser to hit your pages [Markdown site] [1]:

> The overriding design goal for Markdown's
> formatting syntax is to make it as readable 
> as possible. The idea is that a
> Markdown-formatted document should be
> publishable as-is, as plain text, without
> looking like it's been marked up with tags
> or formatting instructions.

Reasons Not To Use This Tool
-----
(They are legion)
 - It is **not supported**. By anyone. Under any circumstances. Ever.
 - There's a good chance the author will never update it again. I'm off slaying Jedi, after all.
 - You need to be somewhat technical to get it installed and running
 - For reasons that won't be explained here, it is very difficult to dependably pre-populate the cache of all VizQL Server processes on your server. This tool uses brute force and generally does a "good enough" job. Not perfect, not even great...not meant to be.


Version
----

1.0



Installation
--------------

 - To begin, you must download and install [Node.Js] for your operating system
 - Then, head to [PhantomJS] to download and install the the distiruvtion for the OS you're running
 - Next, download the code using the **Download** button to your right
 - Unzip to the folder of your choice, and navigate there on the command-line
 - Execute these commands to prepare the app
 
```sh
npm install 
```

##### Windows Only

* You may see a build error related to phantom and installing Microsoft build tools or Visual Studio. Ignore it. Stupid Windows.
* phantomjs.exe was unzipped and copied to **your folder\node_modules\phantom\lib\phantom**. Ensure it is there, and/or read the npm install output to determine where it landed.
* Add the full path to the exe into your computer's PATH statement. Example D:\SithCacher\node_modules\phantom\lib\phantom
* Your current command-line window won't register this change. Close it and launch a new one.

To run the app on Mac \ Windows \ Linux:

```sh
node app
```
Script Configuration
-----------

Modify these settings in **\config\default.json**:

**host**: The location to your Tableau Server. Include http:// or https:// on the URL

**username**: The username which will be used to connect to Tableau Server and request reports
**reload**: The interval, in milliseconds that the script waits to re-request reports. 

>Examples: 
 * 2700000: 45 minutes
 * 10800000: 3 hours 

Do NOT do something foolish and set this to a low value like 10 minutes. 

** executions**: The number of times each report will get executed. Should be set to at least 1x times the number of VizQLs on your machine. For best effect, set between 1.5x - 2x: 2 VizQLS = 3-4 executions, 3 VizQLs =   5-6 executions

#### Reports section
Use this area to define each report you wish to execute. Example:

        {
            "reportName": "Growth of Walmart",
            "reportURL": "/views/Sales/GrowthofWalmart?:refresh=yes",
            "reportSite": ""
        },


Launch the report named "Growth of Walmart" in the defaul site.  The report is found at  /views/Sales/GrowthofWalmart on the Tableau Server. Use the :refresh=yes parameter

        {
           "reportName": "The Hello Viz",
            "reportURL": "/views/Foo/Hello2?:refresh=yes&Region=West",
            "reportSite": ""
        },

Execute "The Hello Viz" found at /views/Foo/Hello. Refresh data and filter down to the West region.

        {
           "reportName": "Rainy days and Mondays always get me down",
            "reportURL": "/t/Site3/views/Songs/ILuvKaren?:refresh=yes",
            "reportSite": "Site3"
        },

Execute a dashboard named after the best song ever and refresh data This report lives a Tableau multi-tenant site with an ID of "Site3". Does the username you specified in **username** have access to this site? They should.

Tableau Server Configuration
----
This application leverages Tableau **Trusted Authentication** to enable the user specified in the config file to connect and execute reports. Please review the [documentation] on same, and configure Tableau to trust the IP address or Machine Name of the box which runs this application. 

Ricense
----

MIT


**Free Software, Hell Yeah!**

FAQ
----
####Reports come back out of order in the display. Why?
The order in which reports are executed against Tableau is irrelevant in terms of the order they'll return - each report takes a different amount of time to complete, after all. 



Thanks, [Darth FlashyPants]
[PhantomJS]:http://phantomjs.org
[Node.js]:http://nodejs.org/
[Darth FlashyPants]:http://twitter.com/lordflashypants
[documentation]:http://onlinehelp.tableausoftware.com/current/server/en-us/help.htm#trusted_auth_trustIP.htm

