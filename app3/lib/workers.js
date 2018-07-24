/*

    worker related tasks
*/

// dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');

const workers = {};

workers.gatherAllChecks = () => {
    _data.list('checks',(err,checks) => {
        if(!err && checks && checks.length > 0) {
            checks.forEach((check) => {
                _data.read('checks',check,(err,originCheckData) => {
                    console.log(originCheckData);
                    if(!err && originCheckData) {
                        workers.validateCheckData(originCheckData);
                    } else {
                        console.log('error reading data');
                    }
                });
            });
        } else {
            console.log('error: could not find any checks to process');
        }
    })
};

workers.validateCheckData = (originCheckData) => {
    // run checks
    originCheckData = typeof(originCheckData) == 'object' && originCheckData != null ? originCheckData : {};
    originCheckData.id = typeof(originCheckData.id) == 'string' && originCheckData.id.trim().length == 20 ? originCheckData.id.trim() : false; 
    originCheckData.userPhone = typeof(originCheckData.userPhone) == 'string' && originCheckData.userPhone.trim().length == 10 ? originCheckData.userPhone.trim() : false;
    originCheckData.protocol = typeof(originCheckData.protocol) == 'string' && ['http','https'].indexOf(originCheckData.protocol) > -1 ? originCheckData.protocol : false;
    originCheckData.url = typeof(originCheckData.url) == 'string' && originCheckData.url.trim().length > 0 ? originCheckData.url.trim() : false; 
    originCheckData.method = typeof(originCheckData.method) == 'string' && ['post','get','put','delete'].indexOf(originCheckData.method) > -1 ? originCheckData.method : false;
    originCheckData.successCodes = typeof(originCheckData.successCodes) == 'object' && originCheckData.successCodes instanceof Array && originCheckData.successCodes.length > 0 ? originCheckData.successCodes : false;
    originCheckData.timeoutSeconds = typeof(originCheckData.timeoutSeconds) == 'number' && originCheckData.timeoutSeconds % 1 === 0 && originCheckData.timeoutSeconds >= 1 && originCheckData.timeoutSeconds <= 5 ? originCheckData.timeoutSeconds : false;

    // set keys that may not be set if check is new to workers
    originCheckData.state = typeof(originCheckData.state) == 'string' && ['up','down'].indexOf(originCheckData.state) > -1 ? originCheckData.state : 'down';
    originCheckData.lastChecked = typeof(originCheckData.lastChecked) == 'number' && originCheckData.lastChecked > 0 ? originCheckData.lastChecked : false;

    // check for pass
    if(originCheckData.id && originCheckData.userPhone && originCheckData.protocol &&
        originCheckData.url && originCheckData.method && originCheckData.successCodes &&
        originCheckData.timeoutSeconds) {
            workers.performCheck(originCheckData);
        } else {
            console.log('error: skipping ill formed check');
        }
};

workers.performCheck = (originCheckData) => {
    
    const checkOutcome = {
        'error':false,
        'responseCode':false
    }; // checkOutcome

    let outcomeSent = false;
    const parsedURL = url.parse(originCheckData.protocol+'://'+originCheckData.url,true);
    const hostname = parsedURL.hostname;
    const path = parsedURL.path; // path includes querystring data
    
    const requestDetails = {
        'protocol':originCheckData.protocol+':',
        'hostname':hostname,
        'method':originCheckData.method.toUpperCase(),
        'path':path,
        'timeout':originCheckData.timeoutSeconds * 1000
    }; // requestDetails

    const _moduleToUse = originCheckData.protocol == 'http' ? http : https;
    const req = _moduleToUse.request(requestDetails,(res) => {
        const status = res.statusCode;
        checkOutcome.responseCode = status;
        if(!outcomeSent) {
            workers.processCheckOutcome(originCheckData,checkOutcome);
            outcomeSent = true;
            console.log(status,outcomeSent);
        }
    });

    // catch thrown error event
    req.on('error',(e) => {
        checkOutcome.error = {
            'error':true,
            'value':e
        };
        if(!outcomeSent) {
            workers.processCheckOutcome(originCheckData,checkOutcome);
            outcomeSent = true;
        }
    });

    // catch the timeout event
    req.on('timeout',(e) => {
        checkOutcome.error = {
            'error':true,
            'value':'timeout'
        };
        if(!outcomeSent) {
            workers.processCheckOutcome(originCheckData,checkOutcome);
            outcomeSent = true;
        }
    });

    req.end();
};

workers.processCheckOutcome = (originCheckData,checkOutcome) => {
    const state = !checkOutcome.error && checkOutcome.responseCode && originCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
    // alert ??? lastChecked still truthy AND has state changed
    const alertWarrented = originCheckData.lastChecked && originCheckData.state !== state ? true : false;
    const newCheckData = originCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();
    _data.update('checks',newCheckData.id,newCheckData,(err) => {
        if(!err) {
            if(alertWarrented) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log('no alert, check outcome has not changed');
            }
        } else {
            console.log('error: cannot save check update');
        }
    });
};

workers.alertUserToStatusChange = (newCheckData) => {
    const msg = 'alert::check:'+newCheckData.method.toUpperCase()+'|'+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;
    helpers.sendTwilioSMS(newCheckData.userPhone,msg,(err) => {
        // dog and pony algorithm
        //if(!err) {
            console.log('successful SMS alert sent:',msg);
        //} else {
            console.log(err);
        //    console.log('error: unable to send sms to user on check state change');
        //}
    });
};

workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    },1000*60);
}

workers.init = () => {
    workers.gatherAllChecks();
    workers.loop();
};

module.exports = workers;