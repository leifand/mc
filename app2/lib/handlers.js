/*
*   Request Handlers
*/


// dependencies
//
const _data = require('./data');
const helpers = require('./helpers');

// handlers
//
const handlers = {};

handlers.users = (data, callback) => {
    
    let acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        
        handlers._users[data.method](data,callback);

    } else {
        
        callback(405); // method not found
    }
};

// our container for specific user ops
//
handlers._users = {};

// data: fname, lname, phone, password, tosAgreement
//
handlers._users.post = (data, callback) => {
    // checks
    //
    let fname = typeof(data.payload.fname) == 'string' && data.payload.fname.trim().length > 0 ? data.payload.fname.trim() : false;
    let lname = typeof(data.payload.lname) == 'string' && data.payload.lname.trim().length > 0 ? data.payload.lname.trim() : false;
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    let tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(fname && lname && phone && password && tosAgreement) {

        // unique user?
        _data.read('users',phone,(err,data) => {

            if(err) {

                let hashedPassword = helpers.hash(password);

                if(hashedPassword) {

                    let userObject = {
                        'fname': fname,
                        'lname': lname,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };

                    _data.create('users',phone,userObject,(err) => {

                        if(!err) {

                            callback(200);

                        } else {

                            console.log(err);
                            callback(500,{'error':'failed to create new user!'});
                        }
                    });

                } else {

                    callback(500,{'error':'failed hash!'});

                }

            } else {

                callback(400,{'error':'that phone number already exists'});
            };

        });

    } else {

        callback(400,{'error':'missing required fields'});
    }
};

handlers._users.get = (data, callback) => {
    
};

handlers._users.put = (data, callback) => {
    
};

handlers._users.delete = (data, callback) => {
    
};

handlers.sample = (data, callback) => {
    // callback http status code
    // payload (object)
    callback(406,{'name':'sample handler'});
};

handlers.ping = (data, callback) => {
    callback(200);
};

handlers.notFound = (data, callback) => {
    callback(404);
};

module.exports = handlers;