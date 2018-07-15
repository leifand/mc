/*
*   helpers for various tasks
*
*/

const crypto = require('crypto');
const config = require('./config');

const helpers = {};

// sha256 hash
//
helpers.hash = (str) => {
    if(typeof(str)=='string' && str.length > 0) {

        let hash = crypto.createHmac('sha256',config.hashSecret).update(str).digest('hex');
        return hash;

    } else {

        return false;
    }
};

// parse JSON without throwing exception
//
helpers.parseJSONtoObj = (str) => {

    try {

        let obj = JSON.parse(str);
        return obj;

    } catch(e) {

        return {};
    }
};

module.exports = helpers;