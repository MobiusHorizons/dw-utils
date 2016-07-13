'use strict'


var yazl = require('yazl')
var fs = require('fs')
var path = require('path')
var glob = require('glob')
var shortid = require('shortid')

function zip(cartridges, metadataPath, outfile){
  return new Promise((resolve, reject) => {
    var zipfile = new yazl.ZipFile()


    //glob(cartridges + '/**/*(static|scripts|templates|forms|pipelines)/**', {
    glob(cartridges + '/**', {
      nosort: true,
      nodir: true
    },
    function(err, matches){
      if (err){
        reject(err)
        return
      }
      for (var i = 0; i < matches.length; i++){
        var file = matches[i]
        //var compress = !/\.(png|gif|jpg|jpeg)$/.test(file)
        var zipPath = path.join(metadataPath, path.relative(cartridges, file))
        zipfile.addFile(file, zipPath)
      }
      zipfile.end()

      zipfile.outputStream.on('end', () => {
        resolve()
      })

      zipfile.outputStream.pipe(fs.createWriteStream(outfile))
      .on('end', () => {
        console.log('write Stream Ended')
      })
      .on('error', (err) => {
        reject(err)
      })
    })
  })
}

function zipFiles(files, local_base, remote_base, server){
  return new Promise((resolve, reject) => {
    var zipfile = new yazl.ZipFile()
    var tempzip = shortid.generate() + '.zip'


    for (var i = 0; i < files.length; i++){
      var file = files[i]
      if (file[0]){
        zipfile.addEmptyDirectory(file[1])
      } else {
        var zipPath = path.join(remote_base, path.relative(local_base, file[1]))
        zipfile.addFile(file[1], zipPath)
      }
    }
    zipfile.end()

    zipfile.outputStream.on('end', () => {
    })

    zipfile.outputStream.pipe(server.upload_stream(tempzip))
    .on('end', () => {
      resolve(tempzip)
    })
    .on('error', (err) => {
      reject(err)
    })
  })
}



module.exports.zip = zip
module.exports.zipFiles = zipFiles
