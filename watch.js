function watch(config){
  'use strict'
  var
    chalk    = require('chalk'),
    chokidar = require('chokidar'),
    dwServer = require('dw-webdav'),
    path     = require('path'),
    utils    = require('./utils')
  
  
  var host       = config.hostname
  var version    = config.version
  var username   = config.username
  var cartridges = config.cartridges
  var password   = config.password
  

  var server = new dwServer(host, username, password)

  var current_line = 0
  var upload_queue = []
  var uploading = false

  function bulk_upload(zip_files){
    uploading = true

    var line = out(chalk.yellow.italic(`[ ] Bulk updating ${zip_files.length} items: Uploading...`))
    var files = zip_files.map((file) => {
      return [file.length == 3, file[0]]
    })

    utils.zipFiles(files, cartridges, version, server)
    .then((temp) => {
      out(chalk.yellow(`[ ] Bulk updating ${zip_files.length} items: Unzipping...`), line)
      return server.unzip(temp).then(() => {
        return temp
      })
    })
    .then((temp) => {
      out(chalk.yellow.underline(`[ ] Bulk updating ${zip_files.length} items: cleaning up...`), line)
      return server.delete(temp)
    })
    .then(() => {
      out(chalk.green(`[*] Bulk updating ${zip_files.length} items: done`), line)
      for (var i = 0; i < zip_files.length; i++){
        var file = zip_files[i]
        out(file[2], file[3])
      }
    })
    .catch(error)
    .then(() => {
      uploading = false
      process_queue()
    })
  }

  function process_queue(){
    if (upload_queue.length > 0 && upload_queue.length < 5){
      var next = upload_queue.shift()
      if (next.length == 3){ // directory
        upload_dir(next[0], next[1], next[2])
      } else {
        upload_file(next[0], next[1], next[2], next[3])
      }
    } else if (upload_queue.length >= 5){
      var zip_files = upload_queue
      upload_queue = []
      bulk_upload(zip_files)
    }
  }

  function upload_dir(remote, success, line){
    server.mkdir(remote).then(() => {
      out(success, line)
    })
    .catch(error)
    .then(() => {
      uploading = false
      process_queue()
    })
  }

  function upload_file(local, remote, success, line){
    uploading = true
    server.upload(local, remote)
    .then(() => {
      out(success,line)
    })
    .catch(error)
    .then(() => {
      uploading = false
      process_queue()
    })
  }

  function out(value, line){
    var newline = (line == null)

    line = line || current_line
    var moved_lines = current_line - line
    var up = '', down = ''
    if (moved_lines > 0){
      up = `\x1b[${moved_lines}A`
      down = `\x1b[${moved_lines}B`
    }
    if (newline){
      console.log(up + '\r\x1b[2K' + value + down + '\r')
    } else {
      process.stdout.write(up + '\r\x1b[2K' + value + down + '\r' )
    }
    if (newline){
      current_line++
    }
    return line
  }

  function upload(event){
    return function(file){
      var display = path.relative(cartridges, file)
      var line = out(chalk.yellow(`[ ] ${display} was ${event}`))
      if (uploading){
        upload_queue.push([file, path.join(version, display),chalk.green(`[*] ${display} was ${event}`), line])
      } else {
        upload_file(file, path.join(version, display),chalk.green(`[*] ${display} was ${event}`), line)
      }
    }
  }

  function unlink(file){
    file = path.relative(cartridges, file)
    var line = out(chalk.yellow(`[ ] ${file} was deleted`))
    server.delete(path.join(version, path.relative(cartridges, file)))
    .then(() => {
      out(chalk.green.strikethrough(`[*] ${file} was deleted`),line)
    })
    .catch(error)
  }

  function mkdir(file){
    var display = path.relative(cartridges, file)
    var line = out(chalk.yellow(`${display} was created`))
    // queue all file creates in a zip file
    upload_queue.push([path.join(version, display), chalk.green(`${display} was created`), line])
    process_queue()
  }

  function error(error){
    out(error)
  }

  function ready(){
    out(chalk.yellow.bold(' -- Waiting for changes --'))
  }

  chokidar.watch(cartridges, {persistent: true, ignoreInitial: true, awaitWriteFinish: {stabilityThreshold: 100,pollInterval: 100}})
  .on('add'   , upload('added'))
  .on('change', upload('changed'))
  .on('unlink', unlink)
  .on('addDir', mkdir)
  .on('unlinkDir', unlink)
  .on('error', error)
  .on('ready', ready)

}

module.exports = watch
