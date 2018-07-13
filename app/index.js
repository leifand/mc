/* 
* Primary API file
* url checker 
*
*/

const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');

const server = http.createServer(function(req,res){
    //get url
    var parsedUrl = url.parse(req.url, true);
    //get path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');
    // get query string as an obj
    var queryStringObj = parsedUrl.query;
    // get http method
    var method = req.method.toLowerCase();    
    // get header as obj
    var headers = req.headers;
    //get payload if it exists
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });
    req.on('end', function(){
        buffer += decoder.end();
        // choose handler
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObj' : queryStringObj,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
        };
        // route request to handler specified
        chosenHandler(data,function(statusCode, payload){
            //default status code
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            //default payload 
            payload  = typeof(payload) == 'object' ? payload : {};
            var payloadString = JSON.stringify(payload);
            //send response
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            // log
            console.log('response: ',statusCode, payloadString);
        });
    });
});

server.listen(config.port, function(){
    console.log('SERVER RUNNING ON PORT:'+config.port+' in '+config.envName+' mode');
});

// handlers
const handlers = {};
handlers.sample = function(data, callback){
    // callback http status code
    // payload (object)
    callback(406,{'name':'sample handler'});
};
handlers.notFound = function(data, callback){
    callback(404);
};
// our req router
const router = {
    'sample' : handlers.sample
};