var yazl = require('yazl');
var fs = require('fs')
var path = require('path');
var glob = require('glob');

function zip(cartridges, metadataPath, outfile){
  return new Promise((resolve, reject) => {
    var zipfile = new yazl.ZipFile()


    glob(cartridges + '/**/*(static|scripts|templates|forms|pipelines)/**', {
      nosort: true,
      nodir: true
    },
    function(err, matches){
      if (err){
        reject(err)
        return;
      }
      var waiting = []
      for (var i = 0; i < matches.length; i++){
        var file = matches[i]
        var compress = !/\.(png|gif|jpg|jpeg)$/.test(file);
        zipPath = path.join(metadataPath, path.relative(cartridges, file));
        zipfile.addFile(file, zipPath, {compress : compress})
      }
      zipfile.end()

      zipfile.outputStream.on('end', () => {
        resolve()
        })

      zipfile.outputStream.pipe(fs.createWriteStream(outfile))
      .on('end', () => {
        console.log('write Stream Ended');
      })
      .on('error', (err) => {
         reject(err)
      })
    });
  })
}

module.exports.zip = zip
