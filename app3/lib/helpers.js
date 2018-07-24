/*
*   helpers for various tasks
*
*/

const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');


const helpers = {};

// sha256 hash
//
helpers.hash = (str) => {
    if(typeof(str)=='string' && str.length > 0) {
        const hash = crypto.createHmac('sha256',config.hashSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// parse JSON without throwing exception
//
helpers.parseJSONtoObj = (str) => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch(e) {
        return {};
    }
};

helpers.createRandomString = (len) => {
    len = typeof(len) == 'number' && len > 0 ? len : false;
    if(len) {
        const possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let str = '';
        for(let i=0;i<len;i++) {
            const randChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
            str += randChar;
        }
        return str;
    } else {
        return false;
    }
};

helpers.sendTwilioSMS = (phone,msg,callback) => {
    phone = typeof(phone) == 'string' && phone.trimLeft() == 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim() > 0 && msg.trim() <= 1600 ? msg.trim() : false;
    if(phone && msg) {
        // twilio payload
        const payload = {
            'From':config.twilio.fromPhone,
            'To':'+1'+phone,
            'Body':msg
        }
        const stringPayload = querystring.stringify(payload);
        const requestDetails = {
            'protocol':'https:',
            'hostname':'api.twilio.com',
            'method':'POST',
            'path':'/2010-04-01/Accounts/'+config.twilio.accountSID+'/Messages.json',
            'auth':config.twilio.accountSID+':'+config.twilio.authToken,
            'headers': {
                'Content-Type':'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };
        const req = https.request(requestDetails,(res) => {
            const status = res.statusCode;
            if(status == 200 || status == 201) {
                callback(false);
            } else {
                callback('status code: '+status);
            }
        });
        // catch error event
        req.on('error',(e) => { 
            callback(e);
        });
        req.write(stringpayload);
        req.end();

    } else {
        callback('invalid or missing parameters');
    }
};

module.exports = helpers;