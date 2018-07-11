/* 
* Primary API file
* url checker 
*
*/

//@ts-check
const http = require('http');
const url = require('url');

const server = http.createServer(function(req,res){
    //get url
    let parsedUrl = url.parse(req.url, true);
    //get path
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g,'');
    //send response
    res.end('yo bro');
    // log path
    console.log('request received on path: '+trimmedPath);
});

server.listen(3000, function(){
    console.log('SERVER RUNNING ON PORT 3000');
});