var Git = require('nodegit');
var conf = {};

var openRepository = (buf) => {
  return Git.Repository.open(buf);
};

var getConfig = (repository) => {
  return repository.configSnapshot();
}

/*var getConfig = (name) => {
  return (config) => {
    return config.getStringBuf(name)
  }
}*/

var getFromUser = (name) => {
  return () => {
    return "";
  }
}

var setVariable = (key) => {
  return (buf) => {
    conf[key] = buf;
  }
}

Git.Repository.discover(".", 0, "/")
  .then(openRepository)
  .then(getConfig)
  .then((config) => {
    var p = [
      config.getStringBuf('dw.username')
        .catch(getFromUser('dw.username'))
        .then(setVariable('username')),
      config.getStringBuf('dw.host')
        .catch(getFromUser('hostname'))
        .then(setVariable('host'))
    ];
    return Promise.all(p)
  })
  .then(() => {
    console.log(conf);
  })
  .catch( (error) => {
    console.log("Error: ", error);
  })

