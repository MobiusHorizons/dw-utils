#!/usr/bin/env node
'use strict'
var clean           = require('../clean')
var upload          = require('../upload')
var watch           = require('../watch.js')
var prompt          = require('../prompt')
var log             = require('../log')
var cli             = require('cli')
var findProjectRoot = require('find-project-root')
var fs              = require('fs')
var path            = require('path')

var root = findProjectRoot(process.cwd(), {
  maxDepth: 12,
  markers : ['.git', '.hg', 'project.json']
})

//cli.debug('project root: ' + root)

var opts = {}
try {
  opts = require(path.join(root, 'dw.json'))
} catch (e) {
  //  cli.debug(e)
  // no dw.json found
  //  cli.debug('No dw.json found at the project root, continuing with configuration from arguments')
}

var copts = cli.parse({
  version    : ['V', 'Code version to upload to (Default is version1)', 'string'],
  hostname   : ['H', 'Hostname of remote DW server', 'host'],
  username   : ['u', 'Username for WebDav (Same as Business Manager)', 'string'],
  cartridges : ['C', 'Path to Cartridges from project root (Default is cartridges)', 'path'],
  save       : [false, 'Save settings for future use', 'bool'],
  prompt     : ['p', 'Prompt for password', 'bool'],
  stability  : ['s', 'Stability theshold in ms for file watching', 'number',  /^win/.test(process.platform)?500:100],
  interval   : ['i', 'Polling interval (in seconds) for log watching', 'number', 5], 
}, ['clean', 'upload-version', 'init', 'watch', 'log'])


function usage(flag){
  cli.error('please provide a ' + flag)
  cli.getUsage()
}

function arg(){
  if (cli.args.length > 0){
    return cli.args.shift()
  } 
  return undefined
}

if (cli.command == 'init'){
  prompt.init(opts).then((config) => {
    fs.writeFileSync(path.join(root, 'dw.json'), JSON.stringify(config, null, 2))
  })
} else {

  opts.hostname   = copts.hostname   || opts.hostname   || arg()              || usage('hostname')
  opts.version    = copts.version    || opts.version    || arg()              || 'version1'
  opts.username   = copts.username   || opts.username   || usage('username')
  opts.cartridges = copts.cartridges || opts.cartridges || arg()              || 'cartridges'

  switch(cli.command){ // command specific arguments
  case 'upload-version':
    opts.zipfile = arg() || usage('zip file to upload')
    break
  case 'log':
    opts.level = arg()
    opts.interval = copts.interval * 1000
    break
  }

  var gotPassword

  if (!opts.password || copts.prompt) {
    gotPassword = prompt.getPassword(opts)
  } else {
    gotPassword = Promise.resolve(opts)
  }

  gotPassword.then((opts) => {
    if (copts.save){
      fs.writeFileSync(path.join(root, 'dw.json'), JSON.stringify(opts, null, 2))
    }

    opts.root = root
    opts.cartridges = path.join(root, opts.cartridges)
    opts.prompt = prompt.getPassword
    opts.stabilityThreshold = copts.stability

    switch (cli.command){
    case 'clean':
      clean(opts)
      break
    case 'upload': case 'upload-version':
      upload(opts)
      break
    case 'watch':
      watch(opts)
      break
    case 'log':
      log(opts)
      break
    default: 
      usage('command')
    }
  })
}
