'use strict'

let versionRegex = new RegExp('([-_\\w\\d]+)/(\\d+)/(\\d+)')
let dwServer = require('dw-webdav');
let request = require('request');
  
function activateVersion(config){
  var version    = config.version
  
  process.stdout.write(`Activating version '${version}' .`)
  let onProgress = () => { process.stdout.write('.') }
  activate(config, version, onProgress).then(() => {
    console.log(' done');
  })
  .catch((e) => {
    console.log(' ',e);
  })
}

function activate(config, version, onProgress){
  // try login
  let req = request.defaults({jar : true}); // cookies.
  let login_url = 'https://' + config.hostname + '/on/demandware.store/Sites-Site/default/ViewApplication-ProcessLogin';
  let jar = request.jar();
  return new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url : login_url,
      qs  : {
        "LoginForm_Login" : config.username,
        "LoginForm_Password" : config.password,
        "LoginForm_RegistrationDomain" : 'Sites',
      }, jar : jar
    }, (error, response) => {
      if (error){ 
        return reject(error)
      }
      resolve();
    })
  }).then(() => {
    onProgress && onProgress(1,2);
    return new Promise((resolve, reject) => {
      request({
        url :'https://' + config.hostname + '/on/demandware.store/Sites-Site/default/ViewApplication-DisplayWelcomePage',
        jar : jar
      },
      (error, response) => {
        if (error){ 
          return reject(error)
        }
        resolve();
      })
    })
  }).then(() => {
    onProgress && onProgress(1,2);
    return new Promise((resolve, reject) => {
      let activate_url = 'https://' + config.hostname + '/on/demandware.store/Sites-Site/default/ViewCodeDeployment-Activate';
      request({
        url : activate_url,
        qs : {
          CodeVersionID : version,
        }, jar : jar
      }, (error, response, body) => {
        let successRegex = new RegExp(`Successfully activated version '${config.version}'`)
        if (error){ 
          return reject(error)
        } else if (successRegex.test(body)){
          return resolve();
        }
        reject('failed');
      })
    })
  })
}

module.exports = activateVersion
module.exports.activate = activate

