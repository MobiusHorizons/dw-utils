'use strict'
var dwServer = require('dw-webdav')
var Tail = require('./helpers/Tail');
var formatter = require('./helpers/format.js')
var AnimateChunk = require('./helpers/aninateChunk.js')

function log(config){
  let host       = config.hostname
  let username   = config.username
  let password   = config.password
  let level      = config.level || 'error'
  
  let server = new dwServer(host, username, password)
  
  let gotEntries = server.ls('../Logs');
  let regex = new RegExp(`^${level}-blade`)
  let seenLevels = {};

  let animateOut = new AnimateChunk({animationDuration : 500});
  animateOut.pipe(process.stdout);

  gotEntries.then( entries => {
    let newest_logs = entries.filter( entry => {
      let result = regex.test(entry.propstat.prop.displayname)
      return result
    })
    .sort((a, b) => {
      let am = new Date(a.propstat.prop.getlastmodified);
      let bm = new Date(b.propstat.prop.getlastmodified);
      let difference = bm - am;
      return difference / Math.abs(difference) // just return 1, -1 or 0
    }).filter( entry => {
      // get logging level from the name
      let name = entry.propstat.prop.displayname.replace(/^([\w\d-]+)-blade.*$/,"$1")

      if (name in seenLevels) return false;
      seenLevels[name] = 1;
      entry.name = name;
      return true;
    })


    for (let i = 0; i < newest_logs.length; i++){
      let logFile = new Tail({poll_interval: config.interval}, server, '../Logs/' + newest_logs[i].propstat.prop.displayname)
      logFile
      .pipe(new formatter({name :newest_logs[i].propstat.prop.displayname}))
      .pipe(animateOut)
    }
  })
}

module.exports = log
