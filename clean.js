function clean(config){
  'use strict'

  var utils    = require('./utils.js')
  var fs       = require('fs')
  var path     = require('path');
  var branch   = require('git-branch');
  var dwServer = require('dw-webdav')
  var activate = require('./activate');

  var host       = config.hostname
  var version    = config.version
  var username   = config.username
  var cartridges = config.cartridges
  var uploadPath = config.uploadPath || cartridges
  var password   = config.password

  var cartridgeRelativePath = version;
  if (cartridges != uploadPath) {
    cartridgeRelativePath = path.join(version, path.relative(cartridges, uploadPath));
  }

  var server = new dwServer(host, 'dw-utils', username, password)

  var done = () => {
    console.log('done')
  }

  var progress = (p) => {
    if (p.done == true){
      process.stdout.write('\r\x1b[2KUploading:                ... ')
    } else {
      var date = new Date(null)
      date.setSeconds(p.eta) // specify value for SECONDS here
      var eta = '(' + date.toISOString().substr(14, 5) + ')'
      process.stdout.write('\r\x1b[2KUploading:                ... ' + p.percentage.toFixed(1) + '% ' + eta)
    }
  }

  let tries = 0;
  function authError(e){
    if (e == 'EXIT') return Promise.reject('EXIT');

    if (tries >= 3) {
      console.log(`Could Not Connect after ${tries} attempts.`);
      return Promise.reject('EXIT');
    }

    console.log(`Could not connect to '${config.hostname}' as '${config.username}'`);
    console.log('Invalid Username or Password')
    tries ++;

    return config.prompt(config)
      .catch(() => Promise.reject('EXIT'))
      .then((config) =>{
        server = new dwServer(config.hostname, 'dw-utils', config.username, config.password);
        return server.auth()
          .then(() => {
            return config.saveConfig(config).catch(() => {})
          });
      }).catch(authError);
  }

  server.auth()
  .catch(authError)
  .then(() => {
    try {
      let branchName = branch.sync();
      console.log('[ Project Clean on branch \'' + branchName + '\': ' + (new Date()).toLocaleString() + ' ]');
    } catch (e){
      console.log('[ Project Clean: ' + (new Date()).toLocaleString() + ' ]');
    }
  })
  .then(() => {
    process.stdout.write('Zipping local files:      ... ')
    return utils.zip(uploadPath, cartridgeRelativePath, version  + '.zip')
  })
  .then(done)
  .then(() => {
    return server.upload(version + '.zip', progress)
  })
  .then(() => {
    progress({done : true})
  })
  .then(done)
  .then(() => {
    process.stdout.write('Deleting old files:       ... ')
    return server.delete(cartridgeRelativePath)
  })
  .then(done)
  .then(() => {
    process.stdout.write('Unzipping remote file:    ... ')
    return server.unzip(version + '.zip')
  })
  .then(done)
  .then(() => {
    process.stdout.write('Deleting temporary files: ... ')
    var wait = []
    wait.push(server.delete(version + '.zip'))
    wait.push(new Promise((resolve, reject) => {
      fs.unlink(version + '.zip', function(error){
        if (error){
          reject(error)
        } else {
          resolve()
        }
      })
    }))
    return Promise.all(wait)
  })
  .then(done)
  .then(() => {
    if (config.activate){
      process.stdout.write('Activating version:       ... ')
      return activate.activate(config,version)
      .then(done)
    }
    return true;
  })
  .catch((error) => {
    if (error == 'EXIT') return;
    console.log('Error: ', error)
  })
}

module.exports = clean
