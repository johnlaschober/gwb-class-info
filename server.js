var http = require('http');
var mergeJSON = require("merge-json");
var request = require('request'); // Imports libraries
var fs = require('fs');

var groupJSONs = [];
var allURLs = ["http://gwb-json-info.azurewebsites.net/", "https://flamingos.azurewebsites.net/json"];
var indexStack = [];

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
					try
					{
						combinedJSON = mergeJSON.merge(groupJSONs[0], groupJSONs[1]); // Need to manually add more merging here
						try
						{
							fs.writeFile("classJSON.json", combinedJSON, 'utf-8', function (err)  // File writer for saving a json file, not done
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
	fs.writeFile("lastUpdated.txt", Date(), 'utf-8', function (err) 
	{ 
		if (err) 
		{ 
			return console.log(err); 
		} 
	}); 
	setTimeout(concatGroupJsons, 1000 * 60 * 30); // 30 minute refresh in milliseconds 
}
concatGroupJsons();

var server = http.createServer(function (request, response)  // On user connect
{
	try
	{
		var combined = mergeJSON.merge(groupJSONs[0], groupJSONs[1]);
	} catch (err) {}
	
	try
    {
        response.write(JSON.stringify(combined));
		try
		{
			var lastUpdated = fs.readFileSync('lastUpdated.txt', 'utf8');
			console.log("Last updated: " + lastUpdated);
		}
		catch (err){}
    }
    catch (err)
    {
		try
		{
			var importedJSON = JSON.parse(fs.readFileSync('classJSON.json', 'utf8'));
			response.write(JSON.stringify(importedJSON, null, 4));
		}
		catch (err) 
		{
			response.writeHead(200, { "Content-Type": "text/plain" });
			response.write("Something went wrong... " + err);
		}
    }
	response.end();
});

var port = process.env.PORT || 80;
server.listen(port);

console.log("Server running at http://localhost:%d", port);