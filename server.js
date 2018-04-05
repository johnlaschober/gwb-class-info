var http = require('http');
var mergeJSON = require("merge-json");
var request = require('request'); // Imports libraries
var fs = require('fs');

var groupJSONs = [];

var indexStack = [];

function concatOtherGroupsJson(url)
{
	request(url, function (error, response, body) 
	{
		if (!error && response.statusCode == 200) 
		{
			var importedJSON = JSON.parse(body);
			groupJSONs.push(importedJSON);
		}
	});
}

function concatGroupJsons()
{
	concatOtherGroupsJson("http://gwb-json-info.azurewebsites.net/");
	concatOtherGroupsJson("https://flamingos.azurewebsites.net/json");
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
			console.log(lastUpdated);
		}
		catch (err){}
		response.end();
    }
    catch (err)
    {
		response.writeHead(200, { "Content-Type": "text/plain" });
        response.write("Something went wrong... " + err);
		response.end();
    }
});

var port = process.env.PORT || 80;
server.listen(port);

console.log("Server running at http://localhost:%d", port);