/*
    lib for storing and rotating logs

*/

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const lib = {};

lib.baseDir = path.join(__dirname,'/../.logs/');

lib.append = (file,str,callback) => {
    fs.open(lib.baseDir+file+'.log','a',(err,fileDescriptor) => {
        if(!err && fileDescriptor) {
            fs.appendFile(fileDescriptor,str+'\n',(err) => {
                if(!err) {
                    fs.close(fileDescriptor,(err) => {
                        if(!err) {
                            callback(false);
                        } else {
                            callback('failed to close file');
                        }
                    });
                } else {
                    callback('error appending to file');
                }
            });
        } else {
            callback('failure to open file for append');
        }
    });
};

lib.list = (incCompressedLogs,callback) => {
    fs.readdir(lib.baseDir,(err,data) => {
        if(!err && data && data.length > 0) {
            const trimmedFileNames = [];
            data.forEach((fileName) => {
                // add .log files
                if(fileName.indexOf('.log') > -1) {
                    trimmedFileNames.push(fileName.replace('.log',''));
                }
                // add .gz files
                if(fileName.indexOf('.gz.b64') > -1 && incCompressedLogs) {
                    trimmedFileNames.push(fileName.replace('.gz.b64',''));
                }
                callback(false,trimmedFileNames);
            });
        } else {
            callback(err,data);
        }
    });
};

// compress a .log file to a .gz.b64 file in place
lib.compress = (logID,newFileID,callback) => {
    const srcFile = logID+'.log';
    const destFile = newFileID+'.gz.b64';
    fs.readFile(lib.baseDir+srcFile,'utf8',(err,inputString) => {
        if(!err && inputString) {
            zlib.gzip(inputString,(err,buffer) => {
                if(!err && buffer) {
                    fs.open(lib.baseDir+destFile,'wx',(err,fileDescriptor) => {
                        if(!err && fileDescriptor) {
                            fs.writeFile(fileDescriptor,buffer.toString('base64'),(err) => {
                                if(!err) {
                                    fs.close(fileDescriptor,(err) => {
                                        if(!err) {
                                            callback(false);
                                        } else {
                                            callback(err);
                                        }
                                    });
                                } else {
                                    callback(err);
                                }
                            });
                        } else {
                            callback(err);
                        }
                    });
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
    });
};

lib.decompress = (fileID,callback) => {
    const fileName = fileID+'.gz.b64';
    fs.readFile(lib.baseDir+filename,'utf8',(err,str) => {
        if(!err && str) {
            const inBuffer = Buffer.from(str,'base64');
            zlib.unzip(inBuffer,(err,outBuffer) => {
                if(!err && outBuffer) {
                    const outstr = outBuffer.toString();
                    callback(false,outstr);
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
    });
};

lib.truncate = (logID,callback) => {
    fs.truncate(lib.basedDir+logID+'.log',0,(err) => {
        if(!err) {
            callback(false);
        } else {
            callback(err);
        }
    });
};

module.exports = lib;