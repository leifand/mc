/* 
* Primary API file
* url checker 
*
*/

const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

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
        //send response
        res.end('yo bro');
        // log path
        console.log('path: '+trimmedPath+'method: '+method+'query: ', queryStringObj);
        console.log('header: ', headers);
        console.log('payload aquired: ',buffer);
    });
});

server.listen(3000, function(){
    console.log('SERVER RUNNING ON PORT 3000');
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