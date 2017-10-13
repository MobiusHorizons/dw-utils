'use strict'
var 
  dwServer = require('dw-webdav'),
  read     = require('read')

if (!process.stdin.isTTY){
  // readline won't work properly, just read lines, and warn user that passwords will be in the clear;
  read = (config, cb) => {
    let input = config.input || process.stdin
    let output = config.output || process.stdout
    let prompt = config.prompt

    let dataCB = (data) => {
      input.removeListener('data',dataCB) // remove listener;
      // remove trailing newline;
      data = data.trim();
      if (!data.length){
        data = config.default
      }
      cb(null, data)
    }

    if (config.silent){
      console.log('WARNING: the following field will not be hidden')
    }
    output.write(`${prompt} ` + (config['default'] ? `(${config.default}) ` : ''))

    input.on('data', dataCB);
    input.resume();
    input.setEncoding('utf8');
  }
}
function getHostname(config){
  return new Promise((resolve, reject) => {
    read({
      'prompt' : 'Hostname:',
      'default': config.hostname 
    },(err, value) => {
      if (err){
        reject(err)
        return
      }
      config.hostname = value
      resolve(config)
    })
  })
}

function getUsername(config){
  return new Promise((resolve, reject) => {
    read({
      'prompt' : 'Username:',
      'default': config.username
    },(err, value) => {
      if (err){
        reject(err)
        return
      }
      config.username = value 
      resolve(config)
    })
  })
}

function getPassword(config){
  return new Promise((resolve, reject) => {
    read({
      'terminal': true,
      'silent'  : true,
      'replace' : '\u2022',
      'prompt'  : 'Password:',
    },(err, value) => {
      if (err){
        reject(err)
        return
      }
      config.password = value 
      resolve(config)
    })
  })
}

function getVersion(config){
  return new Promise((resolve, reject) => {
    read({
      'prompt' : 'Version:',
      'default': config.version || 'version1'
    },(err, value) => {
      if (err){
        reject(err)
        return
      }
      config.version = value 
      resolve(config)
    })
  })
}

function getCartridges(config){
  return new Promise((resolve, reject) => {
    read({
      'prompt' : 'Cartridge Path:',
      'default': config.cartridges || 'cartridges'
    },(err, value) => {
      if (err){
        reject(err)
        return
      }
      config.cartridges = value 
      resolve(config)
    })
  })
}

function init(config){

  function creds(error){
    if (error) {
      console.log('Error: ', error)
    }
    return getHostname(config)
    .then(getUsername)
    .then(getPassword)
    .then((config) => {
      process.stdout.write('Checking Credentials ... ');
      var server = new dwServer(config.hostname, 'dw-utils', config.username, config.password)
      return server.auth().then(() => {
        console.log('Authenticated!');
        return config
      })
    })
  }
  return creds()
  .catch(creds)
  .then(getVersion)
  .then(getCartridges)
}


module.exports.init = init
module.exports.getHostname = getHostname
module.exports.getUsername = getUsername
module.exports.getPassword = getPassword
module.exports.getVersion = getVersion
module.exports.getCartridges = getCartridges
