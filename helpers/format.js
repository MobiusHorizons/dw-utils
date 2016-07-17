'use strict'

var Transform = require('stream').Transform
var chalk = require('chalk')

function sep(){
  return chalk.red('<' + '='.repeat(process.stdout.columns - 2) + '>\n')
}

function firstline(line){

}

const states = ['start', 'sysinfo', 'reqinfo', 'reqparams', 'stacktrace']
var stateRegexes = {
  'start'     : /\[\d{4}-\d\d-\d\d 1?\d:\d\d:\d\d.\d{3} \w{3}\]/,
  'separator' : /------------------/,
  'sysinfo'   : /System Information/,
  'reqinfo'   : /Request Information/,
  'reqparams' : /Request Parameters/,
  'stacktrace': /Stack trace <[\da-f]+>/,
}

class DWLogFormatter extends Transform{
  constructor(options){
    super(options)
    this.state = 'default'
    this.lineBuffer = '' // holds partial lines (unlikely)
  }
  match(line){
    let transition = false; 
    for (let i = 0; i < states.length; i++){
      let state = states[i];
      if (stateRegexes[state].test(line)){
        this.state = state;
        transition = true; // mark this line as the transition
      }
    }
    switch (this.state){
    case 'start':
      line = transition ? sep() + chalk.yellow(line): chalk.yellow(line)
      break;
    case 'sysinfo':
      line = transition ? chalk.green.underline(line) : chalk.green(line)
      break;
    case 'reqinfo':
      line = transition ? chalk.red.underline(line) : chalk.red(line)
      break;
    case 'reqparams':
      line = transition ? chalk.cyan.underline(line) : chalk.cyan(line)
      break;
    default:
      line = chalk.magenta(line)
    }
    return line + '\n';

  }
  _transform(chunk, encoding, cb){
    let lines = (chunk.toString().split('\n'))
    for (var i = 0; i < lines.length; i++){
      let line = lines[i];
      this.push(this.match(line))
    }
    cb()
  }
}

module.exports = DWLogFormatter
