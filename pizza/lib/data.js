/* 
* Data Library
* simple storage and editing
* Pizza Lord 2018
* by Leif Anderson
* from Node JS Masterclass @ pirple.com
*/

// dependencies
//
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// container for export
//
const lib = {};

// base directory of the data folder
//
lib.baseDir = path.join(__dirname,'/../.data/');

// write data to file
//
lib.create = (dir,file,data,callback) => {
    fs.open(lib.baseDir+dir+'/'+file+'.json','wx',(err,fileDescriptor) => {
        if(!err && fileDescriptor) {
            const stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor,stringData, (err) => {                
                if(!err) {                    
                    fs.close(fileDescriptor, (err) => {                        
                        if(!err) {                            
                            callback(false); // success
                        } else {                            
                            callback('error closing new file');
                        }
                    });
                } else {                    
                    callback('error writing to new file');
                }
            });
        } else {
            callback('could not create new file, it may already exist');
        }    
    });
};

lib.read = (dir,file,callback) => {
    fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf8', (err,data) => {
        if(!err && data) {
            const parsedData = helpers.parseJSONtoObj(data);
            callback(false,parsedData);
        } else {
            callback(err,data);
        }
    });
};

lib.update = (dir,file,data,callback) => {
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+', (err,fileDescriptor) => {
        
        if(!err && fileDescriptor) {
            
            const stringData = JSON.stringify(data);
            fs.truncate(fileDescriptor, (err) => {

                if(!err) {
                    
                    fs.writeFile(fileDescriptor,stringData, (err) => {

                        if(!err) {
                           
                            fs.close(fileDescriptor, (err) => {

                                if(!err) {
                                    
                                    callback(false);

                                } else {
                                    
                                    callback('file close ERROR!!!1'); // alfred e. newman is reincarnated if this occurs xD
                                }
                            });
                            
                        } else {
                            
                            callback('error writing to existing file');
                        }
                    });

                } else {
                    
                    callback('truncation error');
                }
            });

        } else {
            
            callback('could not update, file may not exist');
        }
    });
};

lib.delete = (dir,file,callback) => {
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', (err) => {

        if(!err) {
            callback(false);
        } else {
            callback('error deleting file');
        }
    });
};

lib.list = (dir,callback) => {
    fs.readdir(lib.baseDir+dir+'/',(err,data) => {
        if(!err && data && data.length > 0) {
            const trimmedFilenames = [];
            data.forEach((filename) => {
                trimmedFilenames.push(filename.replace('.json',''));
            });
            callback(false,trimmedFilenames);
        } else {
            callback(err,data);
        }
    });
};

module.exports = lib;