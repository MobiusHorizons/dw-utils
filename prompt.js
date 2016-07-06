'use strict';
  var 
  dwServer = require('dw-webdav'),
    read     = require('read')


function getHostname(config){
  return new Promise((resolve, reject) => {
    read({
      'prompt' : "Hostname:",
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
      'prompt' : "Username:",
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
      'replace' : '*',
      'prompt'  : "Password:",
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
      'prompt' : "Version:",
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
      'prompt' : "Cartridge Path:",
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
        var server = new dwServer(config.hostname, config.username, config.password);
        return server.auth().then(() => {
          return config
        })
      })
  }
  return creds()
  .catch(creds)
  .then(getVersion)
  .then(getCartridges)
}


module.exports.init = init;
module.exports.getHostname = getHostname;
module.exports.getUsername = getUsername;
module.exports.getPassword = getPassword;
module.exports.getVersion = getVersion;
module.exports.getCartridges = getCartridges;
