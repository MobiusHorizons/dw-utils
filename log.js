'use strict'
var dwServer = require('dw-webdav')
var Tail = require('./helpers/Tail');
var formatter = require('./helpers/format.js')

function log(config){
  let host       = config.hostname
  let username   = config.username
  let password   = config.password
  let level      = config.level || 'error'
  
  let server = new dwServer(host, username, password)
  
  let gotEntries = server.ls('../Logs');
  gotEntries.then( entries => {
    let newest_error_log = entries.filter( entry => {
      let regex = new RegExp(`^${level}-blade`)
      let result = regex.test(entry.propstat.prop.displayname)

      return result
    })
    .sort((a, b) => {
      let am = new Date(a.propstat.prop.getlastmodified);
      let bm = new Date(b.propstat.prop.getlastmodified);
      let difference = am - bm;
      return difference / Math.abs(difference)
    })[0]

    let logFile = new Tail({poll_interval: config.interval}, server, '../Logs/' + newest_error_log.propstat.prop.displayname)
    logFile
    .pipe(new formatter())
    .pipe(process.stdout)
  })
}

module.exports = log
