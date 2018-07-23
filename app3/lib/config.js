/* 
* API config file
* url checker 
* create and export configuration vars
*/

// container for envs
const environments = {};

environments.staging = {
    'httpPort':3000,
    'httpsPort':3001,
    'envName':'staging',
    'hashSecret':'tiamat',
    'maxChecks':5,
    'twilio': {
        'accountSID':'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken':'9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone':'+15005550006'
    }
};

environments.production = {
    'httpPort':5000,
    'httpsPort':5001,
    'envName':'production',
    'hashSecret':'bahamut',
    'maxChecks':5,
    'twilio': {
        'accountSID':'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken':'9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone':'+15005550006'
    }
};

const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;