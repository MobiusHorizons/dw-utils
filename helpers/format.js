'use strict'

var Transform = require('stream').Transform
var chalk = require('chalk')
var stripColor  = require('strip-ansi')

function sep(name){
  return chalk.red(
    center('<','=', (`[ ${chalk.gray.underline(name)} ]`), '>') + '\n'
  )
}

function firstline(line){

}

const states = ['start', 'sysinfo', 'reqinfo', 'reqparams', 'stacktrace']
var stateRegexes = {
  'start'     : /\[\d{4}-\d\d-\d\d [01]?\d:\d\d:\d\d.\d{3} \w{3}\]/,
  'separator' : /------------------/,
  'sysinfo'   : /System Information/,
  'reqinfo'   : /Request Information/,
  'reqparams' : /Request Parameters/,
  'stacktrace': /Stack trace <[\da-f]+>/,
}

function center(start, fill, title, end){
  let titleLength = stripColor(title).length;
  let width = process.stdout.isTTY? process.stdout.columns : 80;
  let leftFill = (width - titleLength)/2 - stripColor(start).length;
  let rightFill = Math.ceil((width - titleLength)/2) - stripColor(end).length;
  return `${start}${fill.repeat(leftFill)}${title}${fill.repeat(rightFill)}${end}`;
}

class DWLogFormatter extends Transform{
  constructor(options){
    super(options)
    this.name = options.name ||'';
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
      line = transition ? sep(this.name) + chalk.yellow(line): chalk.yellow(line)
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
    let out = "";
    out += (chalk.magenta(center('[', '-',
        `| ${chalk.underline((new Date()).toTimeString().substring(0,8))} |`,
    ']') + '\n'))

    let lines = (chunk.toString().split('\n'))

    for (var i = 0; i < lines.length; i++){
      let line = lines[i];
      out += (this.match(line))
    }
    this.push(out);
    cb()
  }
}

DWLogFormatter.center = center;
module.exports = DWLogFormatter
