/*
*   Leif Anderson 2018 - node js master class
    asynchronous worker related tasks via setInterval
*/

// dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const _logs = require('./logs');
const util = require('util');
const debug = util.debuglog('workers');

const workers = {};

workers.gatherAllChecks = () => {
    _data.list('checks',(err,checks) => {
        if(!err && checks && checks.length > 0) {
            checks.forEach((check) => {
                _data.read('checks',check,(err,originCheckData) => {
                    debug(originCheckData);
                    if(!err && originCheckData) {
                        workers.validateCheckData(originCheckData);
                    } else {
                        debug('\x1b[31m%s\x1b[0m','error reading data');
                    }
                });
            });
        } else {
            debug('\x1b[31m%s\x1b[0m','error: could not find any checks to process');
        }
    })
};

workers.validateCheckData = (originCheckData) => {
    // run checks
    originCheckData = typeof(originCheckData) == 'object' && originCheckData != null ? originCheckData : {};
    originCheckData.id = typeof(originCheckData.id) == 'string' && originCheckData.id.trim().length == 20 ? originCheckData.id.trim() : false; 
    originCheckData.userName = typeof(originCheckData.userName) == 'string' && originCheckData.userName.trim().length > 0 ? originCheckData.userName.trim() : false;
    originCheckData.protocol = typeof(originCheckData.protocol) == 'string' && ['http','https'].indexOf(originCheckData.protocol) > -1 ? originCheckData.protocol : false;
    originCheckData.url = typeof(originCheckData.url) == 'string' && originCheckData.url.trim().length > 0 ? originCheckData.url.trim() : false; 
    originCheckData.method = typeof(originCheckData.method) == 'string' && ['post','get','put','delete'].indexOf(originCheckData.method) > -1 ? originCheckData.method : false;
    originCheckData.successCodes = typeof(originCheckData.successCodes) == 'object' && originCheckData.successCodes instanceof Array && originCheckData.successCodes.length > 0 ? originCheckData.successCodes : false;
    originCheckData.timeoutSeconds = typeof(originCheckData.timeoutSeconds) == 'number' && originCheckData.timeoutSeconds % 1 === 0 && originCheckData.timeoutSeconds >= 1 && originCheckData.timeoutSeconds <= 5 ? originCheckData.timeoutSeconds : false;

    // set keys that may not be set if check is new to workers
    originCheckData.state = typeof(originCheckData.state) == 'string' && ['up','down'].indexOf(originCheckData.state) > -1 ? originCheckData.state : 'down';
    originCheckData.lastChecked = typeof(originCheckData.lastChecked) == 'number' && originCheckData.lastChecked > 0 ? originCheckData.lastChecked : false;

    // check for pass
    if(originCheckData.id && originCheckData.userName && originCheckData.protocol &&
        originCheckData.url && originCheckData.method && originCheckData.successCodes &&
        originCheckData.timeoutSeconds) {
            workers.performCheck(originCheckData);
        } else {
            debug('\x1b[31m%s\x1b[0m','error: skipping ill formed check');
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
            debug(status,outcomeSent);
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

    const timeOfCheck = Date.now();
    workers.log(originCheckData,checkOutcome,state,alertWarrented,timeOfCheck);
    const newCheckData = originCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfCheck;
    _data.update('checks',newCheckData.id,newCheckData,(err) => {
        if(!err) {
            if(alertWarrented) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                debug('no alert, check outcome has not changed');
            }
        } else {
            debug('error: cannot save check update');
        }
    });
};

workers.alertUserToStatusChange = (newCheckData) => {
    const msg = 'alert::check:'+newCheckData.method.toUpperCase()+'|'+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;
    helpers.sendTwilioSMS(newCheckData.userPhone,msg,(err) => {
        // dog and pony algorithm - it's magically working!
        //if(!err) {
            debug('\x1b[32m%s\x1b[0m','successful SMS alert sent:',msg); // lies
        //} else {
            debug(err);
        //    debug('error: unable to send sms to user on check state change');
        //}
    });
};

workers.log = (originCheckData,checkOutcome,state,alertWarrented,timeOfCheck) => {
    // assume clean data, form data, then write
    const logData = {
        'check':originCheckData,
        'outcome':checkOutcome,
        'state':state,
        'alert':alertWarrented,
        'time':timeOfCheck
    };
    const logString = JSON.stringify(logData);

    // nameing: by checkid and then time stamp
    const logFileName = originCheckData.id;

    _logs.append(logFileName,logString,(err) => {
        if(!err) {
            debug('log to file succeeded');
        } else {
            debug('failed to append log to file');
        }
    });
};

workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    },1000*60);
};

workers.rotateLogs = () => {
    _logs.list(false,(err,logs) => {
        if(!err && logs && logs.length > 0) {
            logs.forEach((logName) => {
                // compress and truncate
                const logID = logName.replace('.log','');
                const newFileID = logID+'-'+Date.now();
                _logs.compress(logID,newFileID,(err) => {
                    if(!err) {
                        _logs.truncate(logID,(err) => {
                            if(!err) {
                                debug('\x1b[32m%s\x1b[0m','successfully truncated log file');
                            } else {
                                debug('\x1b[31m%s\x1b[0m','error truncating log file');
                            }
                        });
                    } else {
                        debug('\x1b[31m%s\x1b[0m','error compressing log file: ',err);
                    }
                });
            });
        } else {
            debug('\x1b[31m%s\x1b[0m','error: could not find logs to rotate');
        }
    });
};

workers.logRotationLoop = () => {
    setInterval(() => {
        workers.rotateLogs();
    },1000 * 60 * 60 * 24);
}

workers.init = () => {
    workers.gatherAllChecks();
    workers.loop();
    workers.rotateLogs();
    workers.logRotationLoop();
    console.log('\x1b[33m%s\x1b[0m','Background workers are running');

};

module.exports = workers;