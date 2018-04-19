// Basic explanation of this server's functionality

// Client-side stuff
// 1) This is a nodeJS server, so functionality when accessed is at the bottom in the http.createServer function
// 2) It will try to read the JSON from a cached file first through the fs (file system) library
// 3) If that fails, it will try to output the JSON from the server variable

// Server-side stuff
// 1) All other group URLs are stored at the top in the allURLs array
// 2) concatGroupJsons is called first, which reaches out to each URL from the array
// 3) The request library grabs the JSON from each URL and adds it to the groupJSONs array
// 4) Once we get all of the JSON data, format it to be in line with our standards
// 5) After formatting, write the JSON to a cached file
// 6) setTimeout function waits 30 minutes and then caches the file again

// So, for a tutorial, make sure to point out that we are fetching JSON from a bunch of external links. 
// If the tutorial is to change something, make sure to tell the tutorial viewer to edit the formatJSON 
// function to fit with their needs. 

// Known bugs: If JSON doesn't appear on load, refresh the page since Azure is still waking up and 
// on most outside sites. Refreshing should eventually return the concatenated JSON displayed. 

var http = require('http'); // Imports libraries
var mergeJSON = require("merge-json");
var request = require('request'); 
var fs = require('fs');

var groupJSONs = [];
var allURLs = ["http://gwb-json-info.azurewebsites.net/", "https://teamocelots-klump-product.azurewebsites.net/theocelotsteam.json", "https://flamingos.azurewebsites.net/json", "https://back-row-bandicoots-klump.azurewebsites.net/group", "https://softwareengineeringgabe.azurewebsites.net/teamInfo.json"];
var indexStack = [];
var lastUpdatedGlobal;
var combinedJSON;

function concatGroupJsons()
{
	for (i = 0; i < allURLs.length; i++) 
	{
		indexStack.push(i); // Add iterator index to stack to avoid asynchronous callback issues
		request(allURLs[i], function (error, response, body) 
		{
			if (!error && response.statusCode == 200) 
			{
				var importedJSON = JSON.parse(body); // Get JSON from webpage
				groupJSONs.push(importedJSON); // Store JSON
				indexStack.pop(i); // Remove iterator 
				if (indexStack.length == 0) // If this occurs, we know we have all JSONs from all webpages
				{
					formatJSON(); // Jump to format function
					try
					{
						combinedJSON = mergeJSON.merge(groupJSONs[0], groupJSONs[1]); // Need to manually add more merging here
						combinedJSON = mergeJSON.merge(combinedJSON, groupJSONs[2]);
						combinedJSON = mergeJSON.merge(combinedJSON, groupJSONs[3]);
						combinedJSON = mergeJSON.merge(combinedJSON, groupJSONs[4]);
						try // Write to cached file here
						{
							fs.writeFile("classJSON.json", combinedJSON, 'utf-8', function (err)  
							{
								if (err) 
								{
									return console.log("Error writing to classJSON.json: " + err);
								}
							});
						} catch (err) {}
						
					} catch (err) {}
				}
			}
		});
	}
	lastUpdatedGlobal = Date(); // Store last updated time and write it to a file 
	fs.writeFile("lastUpdated.txt", Date(), 'utf-8', function (err) 
	{ 
		if (err) 
		{ 
			return console.log(err); 
		} 
	}); 
	setTimeout(concatGroupJsons, 1000 * 60 * 30); // 30 minute refresh in milliseconds 
}

function formatJSON()
{
	for (i = 0; i < groupJSONs.length; i++)
	{
		// Turn JSON objects to strings and then do string manipulations on them like fixing capitalization
		groupJSONs[i] = JSON.stringify(groupJSONs[i]);
		groupJSONs[i] = groupJSONs[i].replace(/Users/g, "members");
		groupJSONs[i] = groupJSONs[i].replace(/firstName/gi, "FirstName");
		groupJSONs[i] = groupJSONs[i].replace(/lastName/gi, "LastName");
		groupJSONs[i] = groupJSONs[i].replace(/preferredName/gi, "PreferredName");
		groupJSONs[i] = groupJSONs[i].replace(/teamName/gi, "TeamName");
		groupJSONs[i] = groupJSONs[i].replace(/seatLocation/gi, "SeatLocation");
		groupJSONs[i] = groupJSONs[i].replace(/\s/g, "");
		groupJSONs[i] = groupJSONs[i].replace(/roles/gi, "Roles");
		if (!groupJSONs[i].includes("Roles"))
		{
			groupJSONs[i] = groupJSONs[i].replace(/role/gi, "Roles");
		}
		groupJSONs[i] = JSON.parse(groupJSONs[i]);
		// Below: Fix for teams who have a team header but no TeamName assigned to individuals
		for (j = 0; j < groupJSONs[i].members.length; j++) 
		{
			if (groupJSONs[i].members[j].TeamName == null)
			{
				try
				{
					groupJSONs[i].members[j].TeamName = groupJSONs[i].TeamName;
				}
				catch (err)
				{
					groupJSONs[i].members[j].TeamName = "Unlisted";
				}
			}
		}

		try
		{
			delete groupJSONs[i].TeamName;
		}
		catch (err){}
	}
}

concatGroupJsons();

var server = http.createServer(function (request, response)  // On user connect
{
	try
	{
		var importedJSON = JSON.parse(fs.readFileSync('classJSON.json', 'utf8'));
		response.write(JSON.stringify(importedJSON, null, 4)); // Write JSON to screen for user after parsing
	}
	catch (err) 
	{
		try
		{
			var combined = mergeJSON.merge(groupJSONs[0], groupJSONs[1]); // Need to manually add more merging here
			combined = mergeJSON.merge(combined, groupJSONs[2]);
			combined = mergeJSON.merge(combined, groupJSONs[3]);
			combined = mergeJSON.merge(combined, groupJSONs[4]);
			response.write(JSON.stringify(combined)); // Write JSON to screen for user
		} 
		catch (err) 
		{
			response.writeHead(200, { "Content-Type": "text/plain" });
			response.write("JSON is being fetched. Please refresh the page if you see this error: " + err);
		}
	}
	
	// Log last updated info in console...
	try
	{
		var lastUpdated = fs.readFileSync('lastUpdated.txt', 'utf8');
		console.log("Info last updated: " + lastUpdated);
	}
	catch (err)
	{
		try
		{
			console.log("Info last updated: " + lastUpdatedGlobal);
		}
		catch (err)
		{
			console.log("Could not log when last updated.");
		}
	}
	response.end();
});

var port = process.env.PORT || 80;
server.listen(port);

console.log("Server running at http://localhost:%d", port);