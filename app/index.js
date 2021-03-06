/* 
* Primary API file
* url checker 
*
*/

const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// instantiate servers
const httpServer = http.createServer(function(req,res){
    unifiedServer(req,res);
});
const httpsServerOptions = {
    'key':fs.readFileSync('./https/key.pem'),
    'cert':fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions,function(req,res){
    unifiedServer(req,res);
});

// start servers
httpServer.listen(config.httpPort, function(){
    console.log('SERVER RUNNING ON PORT:'+config.httpPort+' in '+config.envName+' mode');
});

httpsServer.listen(config.httpsPort, function(){
    console.log('SERVER RUNNING ON PORT:'+config.httpsPort+' in '+config.envName+' mode');
});

// server logic for http and https
const unifiedServer = function(req,res){
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
};

// handlers
const handlers = {};
handlers.sample = function(data, callback){
    // callback http status code
    // payload (object)
    callback(406,{'name':'sample handler'});
};
handlers.ping = function(data, callback){
    callback(200);
};
handlers.notFound = function(data, callback){
    callback(404);
};

// our req router
const router = {
    'sample':handlers.sample,
    'ping':handlers.ping
};