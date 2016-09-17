'use strict'

var Transform = require('stream').Transform

class AnimateChunk extends Transform {
  constructor(options){
    super(options)
    this.delay = options.animationDuration || 300;
  }

  _transform(chunk, encoding, cb){
    let lines = chunk.toString().split('\n')
    var lineDelay = this.delay / lines.length;
    function queue(line, i, push){
      setTimeout(() => push(line), i * lineDelay);
    }

    for ( let i = 0; i < lines.length; i++){
      let push = this.push.bind(this);

      if (i == lines.length -1){
        push = (line) => {
          this.push(line);
          cb();
        }
      }

      queue((lines[i] + '\n'), i, push);
    }

  }
}

module.exports = AnimateChunk
