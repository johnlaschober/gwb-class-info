var http = require('http');
var mergeJSON = require("merge-json");
var request = require('request'); // Imports libraries
var fs = require('fs');

var groupJSONs = [];
var allURLs = ["http://gwb-json-info.azurewebsites.net/", "https://teamocelots-klump-product.azurewebsites.net/theocelotsteam.json", "https://flamingos.azurewebsites.net/json", "https://back-row-bandicoots-klump.azurewebsites.net/group"];
var indexStack = [];
var lastUpdatedGlobal;
var combinedJSON;

function concatGroupJsons()
{
	for (i = 0; i < allURLs.length; i++)
	{
		indexStack.push(i);
		request(allURLs[i], function (error, response, body) 
		{
			if (!error && response.statusCode == 200) 
			{
				var importedJSON = JSON.parse(body);
				groupJSONs.push(importedJSON);
				indexStack.pop(i);
				if (indexStack.length == 0)
				{
					formatJSON();
					try
					{
						combinedJSON = mergeJSON.merge(groupJSONs[0], groupJSONs[1]); // Need to manually add more merging here
						combinedJSON = mergeJSON.merge(combinedJSON, groupJSONs[2]);
						combinedJSON = mergeJSON.merge(combinedJSON, groupJSONs[3]);
						try
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
	lastUpdatedGlobal = Date();
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
		groupJSONs[i] = JSON.stringify(groupJSONs[i]);
		groupJSONs[i] = groupJSONs[i].replace(/Users/g, "members");
		groupJSONs[i] = groupJSONs[i].replace(/firstName/gi, "FirstName");
		groupJSONs[i] = groupJSONs[i].replace(/lastName/gi, "LastName");
		groupJSONs[i] = groupJSONs[i].replace(/preferredName/gi, "PreferredName");
		groupJSONs[i] = groupJSONs[i].replace(/teamName/gi, "TeamName");
		groupJSONs[i] = groupJSONs[i].replace(/seatLocation/gi, "SeatLocation");
		groupJSONs[i] = groupJSONs[i].replace(/roles/gi, "Roles");
		if (!groupJSONs[i].includes("Roles"))
		{
			groupJSONs[i] = groupJSONs[i].replace(/role/gi, "Roles");
		}
		groupJSONs[i] = JSON.parse(groupJSONs[i]);
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
			response.write(JSON.stringify(importedJSON, null, 4));
		}
		catch (err) 
		{
			try
			{
				var combined = mergeJSON.merge(groupJSONs[0], groupJSONs[1]); // Need to manually add more merging here
				combined = mergeJSON.merge(combined, groupJSONs[2]);
				combined = mergeJSON.merge(combined, groupJSONs[3]);
				response.write(JSON.stringify(combined));
			} 
			catch (err) 
			{
				response.writeHead(200, { "Content-Type": "text/plain" });
				response.write("Something went wrong... " + err);
			}
		}
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