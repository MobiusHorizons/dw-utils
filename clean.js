function clean(config){
  'use strict'

  var utils = require('./utils.js')
  var fs = require('fs')
  var dwServer = require('dw-webdav')

  var host       = config.hostname
  var version    = config.version
  var username   = config.username
  var cartridges = config.cartridges
  var password   = config.password

  var server = new dwServer(host, username, password)

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
  
  function authError(){
    console.log('Invalid Username or Password')
    return config.prompt().then((password) =>{
      server = new dwServer(host, username, password)
      return server.auth()
    }).catch(authError)
  }

  server.auth()
  .catch(authError)
  .then(() => {
    process.stdout.write('Zipping local files:      ... ')
    return utils.zip(cartridges, version, version  + '.zip')
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
    return server.delete(version)
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
  .catch((error) => {
    console.log('Error: ', error)
  })
}

module.exports = clean
