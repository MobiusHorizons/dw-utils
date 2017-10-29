function upload(config){
  'use strict'

  var path = require('path')
  var dwServer = require('dw-webdav')
  var activate = require('./activate')

  var host       = config.hostname
  var username   = config.username
  var password   = config.password
  var zipfile    = config.zipfile
  var version    = path.basename(zipfile)

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
    return server.upload(zipfile, version, progress)
  })
  .then(() => {
    progress({done : true})
  })
  .then(done)
  .then(() => {
    process.stdout.write('Unzipping remote file:    ... ')
    return server.unzip(version)
  })
  .then(done)
  .then(() => {
    process.stdout.write('Deleting remote zip file: ... ')
    return server.delete(version)
  })
  .then(done)
  .then(() => {
    if (config.activate){
      process.stdout.write('Activating version:       ... ')
      return activate.activate(config,version)
      .then(done)
    }
  })
  .catch((error) => {
    console.log('Error: ', error)
  })
}

module.exports = upload
