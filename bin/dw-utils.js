#!/usr/bin/env node
var clean           = require('../clean');
var cli             = require('cli');
var findProjectRoot = require('find-project-root');
var fs              = require('fs');
var path            = require('path');
var read            = require('read');

function prompt(){
  return new Promise((resolve, reject) => {
    read({ prompt : 'Password:', silent : true, replace: '*', }, (error, password)=>{
      if (error){
        reject(error);
      } else {
        resolve(password)
      }
    })
  });
}

var root = findProjectRoot(process.cwd(), {
  maxDepth: 12,
  markers : ['.git', '.hg', 'project.json']
});

//cli.debug('project root: ' + root);

var opts = {};
try {
  opts = require(path.join(root, 'dw.json'));
} catch (e) {
//  cli.debug(e)
  // no dw.json found
//  cli.debug('No dw.json found at the project root, continuing with configuration from arguments');
}

var copts = cli.parse({
  version    : ['V', 'Code version to upload to', 'string (Default is version1)'],
  hostname   : ['H', 'Hostname of remote DW server', 'host'],
  username   : ['u', 'Username for WebDav (Same as Business Manager)', 'string'],
  cartridges : ['C', 'Path to Cartridges from project root (Default is cartridges)', 'path'],
  save       : [false, 'Save settings for future use', 'bool'],
  prompt     : ['p', 'Prompt for password', 'bool'],
}, ['clean', 'upload-version'])


function usage(flag){
  cli.error('please provide a ' + flag);
  cli.getUsage()
}

function arg(){
  if (cli.args.length > 0){
    return cli.args.shift();
  } 
  return undefined
}

opts.hostname   = opts.hostname   || copts.hostname   || arg()              || usage('hostname');
opts.version    = opts.version    || copts.version    || arg()              || 'version1';
opts.username   = opts.username   || copts.username   || usage('username');
opts.cartridges = opts.cartridges || copts.cartridges || arg()              || 'cartridges'

var gotPassword;

if (!opts.password || copts.prompt) {
  gotPassword = prompt()
} else {
  gotPassword = Promise.resolve(opts.password)
}

gotPassword.then((password) => {
  opts.password = password;
  if (copts.save){
    fs.writeFileSync(path.join(root, 'dw.json'), JSON.stringify(opts, null, 2))
  }

  opts.root = root;
  opts.cartridges = path.join(root, opts.cartridges);
  opts.prompt = prompt;

  if (cli.command == 'clean'){
    clean(opts);
  }
})
