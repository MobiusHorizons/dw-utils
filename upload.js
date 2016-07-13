function upload(config){
  'use strict'

  var path = require('path')
  var dwServer = require('dw-webdav')

  var host       = config.hostname
  var username   = config.username
  var password   = config.password
  var zipfile    = config.zipfile
  var version    = path.basename(zipfile)

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
  .catch((error) => {
    console.log('Error: ', error)
  })
}

module.exports = upload
