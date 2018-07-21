/*
*   Request Handlers
*/



// USERS >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// dependencies
//
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

// handlers
//
const handlers = {};

// users handler and _users crud ops
handlers.users = (data, callback) => {
    
    const acceptableMethods = ['post','get','put','delete'];
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
    const fname = typeof(data.payload.fname) == 'string' && data.payload.fname.trim().length > 0 ? data.payload.fname.trim() : false;
    const lname = typeof(data.payload.lname) == 'string' && data.payload.lname.trim().length > 0 ? data.payload.lname.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    // if data is valid ...
    if(fname && lname && phone && password && tosAgreement) {

        // unique user?
        _data.read('users',phone,(err,data) => {

            if(err) {

                // valid hash?
                const hashedPassword = helpers.hash(password);

                if(hashedPassword) {

                    const userObject = {
                        'fname': fname,
                        'lname': lname,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };

                    // successful create / store to disk?
                    _data.create('users',phone,userObject,(err) => {
                        console.log(userObject);
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

// data: phone
//
handlers._users.get = (data, callback) => {
    // valid phone?
    const phone = typeof(data.queryStringObj.phone) == 'string' && data.queryStringObj.phone.trim().length == 10 ? data.queryStringObj.phone.trim() : false;
    if(phone) {
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token,phone,(tokenIsValid) => {
            if(tokenIsValid) {
                // lookup and return user
                _data.read('users', phone, (err,data) => {
                    if(!err && data) {
                    delete data.hashedPassword;
                    callback(200, data);
                } else {
                    callback(404);
                }
            });
            } else {
                callback(403,{'error':'invalid or expired token'});
            }
        });
        
    } else {
        callback(400,{'error':'missing required field'});
    }
};

// update
// data: phone
// other data optional
handlers._users.put = (data, callback) => {
    //required
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    
    // optional
    const fname = typeof(data.payload.fname) == 'string' && data.payload.fname.trim().length > 0 ? data.payload.fname.trim() : false;
    const lname = typeof(data.payload.lname) == 'string' && data.payload.lname.trim().length > 0 ? data.payload.lname.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    tokens
    tokens
    tokens
    tokens
    if(phone) {
        if(fname || lname || password) {
            const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            handlers._tokens.verifyToken(token,phone,(tokenIsValid) => {
                if(tokenIsValid) {
                    //make sure they exist
                    _data.read('users',phone, (err,userData) => {
                        if(!err && userData) {
                            // update field(s)
                            if(fname) {
                                userData.fname = fname;
                            } 
                            if(lname) {
                                userData.lname = lname;
                            }
                            if(password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            // store update
                            _data.update('users',phone,userData,(err) => {
                                if(!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500,{'error':'could not update user'});
                                }
                            });

                        } else {
                            callback(400,{'error':'user not found!!'});
                        }
                    });
                } else {
                    callback(403,{'error':'invalid or expired token'});
                }
            });
        } else {
            callback(400,{'error':'missing fields to update'});
        }
    } else {
        callback(400,{'error':'missing required field'});
    }
};

// data: phone
//       cleanup and delete associated user files
//
handlers._users.delete = (data, callback) => {
    // valid phone?
    const phone = typeof(data.queryStringObj.phone) == 'string' && data.queryStringObj.phone.trim().length == 10 ? data.queryStringObj.phone.trim() : false;
    if(phone) {
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token,phone,(tokenIsValid) => {
            if(tokenIsValid) {
                // lookup and return user
                _data.read('users', phone, (err,data) => {
                    if(!err && data) {
                        _data.delete('users',phone,(err) => {
                            if(!err) {
                                callback(200);
                            } else {
                                callback(500,{'error':'could not delete the user!'});
                            }
                        });
                    } else {
                        callback(400,{'error':'could not find user'});
                    }
                });
            } else {
                callback(403,{'error':'invalid or missing token'});
            }
        });

    } else {
        callback(400,{'error':'missing required field'});
    }
};
// USERS <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// TOKENS >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// tokens handler and crud ops
handlers.tokens = (data, callback) => {
    
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        
        handlers._tokens[data.method](data,callback);

    } else {
        
        callback(405); // method not found
    }
};

// container for token methods
//
handlers._tokens = {};

// data: phone,password
// 
handlers._tokens.post = (data,callback) => {
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(phone && password) {
        _data.read('users',phone,(err,userData)=> {
            if(!err && userData) {
                // valid hash?
                const hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword) {
                    // create token
                    const tokenID = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObj = {
                        'phone':phone,
                        'id':tokenID,
                        'expires':expires
                    };
                    _data.create('tokens',tokenID,tokenObj,(err) => {
                        if(!err) {
                            callback(200,tokenObj);
                        } else {
                            callback(500,{'error':'failed to create new token!'});
                        }
                    });
                } else {
                    callback(400,{'error':'password did not match'});
                }
            } else {
                callback(400,{'error':'user not found'});
            }
        });
    } else {
        callback(400,{'error':'missing required field(s)'});
    }
};

// data: ID
handlers._tokens.get = (data,callback) => {
    // valid id?
    const id = typeof(data.queryStringObj.id) == 'string' && data.queryStringObj.id.trim().length == 20 ? data.queryStringObj.id.trim() : false;
    if(id) {
        // lookup and return token
        _data.read('tokens', id, (err,tokenData) => {
            if(!err && tokenData) {
            
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400,{'error':'_tokens.get missing required field'});
    }
};

// data: id and extend
handlers._tokens.put = (data,callback) => {
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if(id && extend) {
        _data.read('tokens',id,(err,tokenData) => {
            if(!err && tokenData) {
                //expired?
                if(tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    _data.update('tokens',id,tokenData,(err) => {
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500,{'error':'failed to extend token'});
                        }
                    });
                } else {
                    callback(400,{'error':'token has expired'});
                }
            } else {
                callback(400,{'error':'token does not exist'});
            }
        });
    } else {
        callback(400,{'error':'missing or invalid field(s)'});
    }
};

// data: id
handlers._tokens.delete = (data,callback) => {
    // valid id?
    const id = typeof(data.queryStringObj.id) == 'string' && data.queryStringObj.id.trim().length == 20 ? data.queryStringObj.id.trim() : false;
    if(id) {
        // lookup and return user
        _data.read('tokens', id, (err,data) => {
            if(!err && data) {
                _data.delete('tokens',id,(err) => {
                    if(!err) {
                        console.log('deleting: ',id);
                        callback(200);
                    } else {
                        callback(500,{'error':'could not delete the token!'});
                    }
                })
            } else {
                callback(400,{'error':'could not find token'});
            }
        });
    } else {
        callback(400,{'error':'missing required field'});
    }
};

handlers._tokens.verifyToken = (id,phone,callback) => {
    _data.read('tokens',id,(err,tokenData) => {
        if(!err && tokenData) {
            if(tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
}
// TOKENS <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// CHECKS >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// checks handler and crud ops
handlers.checks = (data, callback) => {
    
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        
        handlers._checks[data.method](data,callback);

    } else {
        
        callback(405); // method not found
    }
};

// container for checks methods
//
handlers._checks = {};

// checks post
// data: protocol, url, method, success codes, timeout
//
handlers._checks.post = (data,callback) => {
    const protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol | url | method | successCodes | timeoutSeconds) {
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        _data.read('tokens',token,(err,tokenData) => {
            console.log(token);
            console.log(tokenData);
            if(!err && tokenData) {
                const userPhone = tokenData.phone;
                _data.read('users',userPhone,(err,userData) => {
                    console.log(userPhone);
                    console.log(err);
                    console.log(userData);
                    if(!err && userData) {
                        // ID which checks the user already has
                        const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                        // verify user has less than max checks
                        if(userChecks.length < config.maxChecks) {
                            // create random id for check
                            const checkID = helpers.createRandomString(20);
                            // create check
                            const checkObj = {
                                'id':checkID,
                                'userPhone':userPhone,
                                'protocol':protocol,
                                'url':url,
                                'method':method,
                                'successCodes':successCodes,
                                'timeoutSeconds':timeoutSeconds
                            };
                            // write
                            _data.create('checks',checkID,checkObj,(err) => {
                                if(!err) {
                                    // add new check id to user
                                    userData.checks = userChecks;
                                    userData.checks.push(checkID);
                                    _data.update('users',userPhone,userData,(err) => {
                                        if(!err) {
                                            callback(200,checkObj);
                                        } else {
                                            callback(500,{'error':'could not update user with new check'});
                                        }
                                    });
                                } else {
                                    callback(500,{'error':'could not create new check'});
                                }
                            });
                        } else {
                            callback(400,{'error':'user already has maximum number of checks: '+config.maxChecks});
                        }
                    } else {
                        console.log('failure');
                        callback(403);
                    }
                });
            } else {
                callback(403);
            }
        });
    } else {
        callback(400,{'error':'missing or invalid inputs'});
    }
};


handlers.sample = (data, callback) => {
    callback(406,{'name':'sample handler'});
};

handlers.ping = (data, callback) => {
    callback(200);
};

handlers.notFound = (data, callback) => {
    callback(404);
};

module.exports = handlers;