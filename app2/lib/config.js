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
    'hashSecret':'tiamat'
};

environments.production = {
    'httpPort':5000,
    'httpsPort':5001,
    'envName':'production',
    'hashSecret':'bahamut'
};

const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;