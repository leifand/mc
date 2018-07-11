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
    let parsedUrl = url.parse(req.url, true);
    //get path
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g,'');
    // get query string as an obj
    let queryStringObj = parsedUrl.query;
    // get header as obj
    let headers = req.headers;
    let decoder = new StringDecoder('utf-8')
    // get http method
    let method = req.method.toLowerCase();
    //send response
    res.end('yo bro');
    // log path
    console.log('path: '+trimmedPath+'method: '+method+'query: ', queryStringObj);
    console.log('header: ', headers);
});

server.listen(3000, function(){
    console.log('SERVER RUNNING ON PORT 3000');
});