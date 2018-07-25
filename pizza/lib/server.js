/*
* server related tasks
*
*
*/

const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');
const util = require('util');
const debug = util.debuglog('server');

helpers.sendTwilioSMS('4694221552','SYSTEM FAILURE ALERT',(err) => {
    console.log('\x1b[37m%s\x1b[0m','confucious says: your twilio fears are ...',err);
});

const server = {};

// instantiate servers
server.httpServer = http.createServer((req,res) => {
    server.unifiedServer(req,res);
});

server.httpsServerOptions = {
    'key':fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert':fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions,(req,res) => {
    server.unifiedServer(req,res);
});

// server logic for http and https
server.unifiedServer = (req,res) => {
    //get url
    const parsedUrl = url.parse(req.url, true);
    //get path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');
    // get query string as an obj
    const queryStringObj = parsedUrl.query;
    // get http method
    const method = req.method.toLowerCase();    
    // get header as obj
    const headers = req.headers;
    //get payload if it exists
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();
        // choose handler
        const chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
        const data = {
            'trimmedPath' : trimmedPath,
            'queryStringObj' : queryStringObj,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJSONtoObj(buffer)
        };
        // route request to handler specified
        chosenHandler(data,(statusCode, payload) => {
            //default status code
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            //default payload 
            payload  = typeof(payload) == 'object' ? payload : {};
            const payloadString = JSON.stringify(payload);
            //send response
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            // log
            if(statusCode == 200 || statusCode == 201 || statusCode == 300 || statusCode == 301) {
                debug('\x1b[32m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
            } else {
                debug('\x1b[31m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
            }
        });
    });
};

// initialzation
server.init = () => {
// start servers
    server.httpServer.listen(config.httpPort, () => {
        console.log('\x1b[36m%s\x1b[0m','PUBLIC PIZZA LORD SERVER RUNNING ON PORT:'+config.httpPort+' in '+config.envName+' mode');
    });

    server.httpsServer.listen(config.httpsPort, () => {
        console.log('\x1b[35m%s\x1b[0m','SECURE PIZZA LORD SERVER RUNNING ON PORT:'+config.httpsPort+' in '+config.envName+' mode');
    });
};

// our req router
//
server.router = {
    'sample':handlers.sample,
    'ping':handlers.ping,
    'users':handlers.users,
    'tokens':handlers.tokens,
    'checks':handlers.checks
};

module.exports = server;