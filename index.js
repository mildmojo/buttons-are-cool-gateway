'use strict';
const fs = require('fs');
const nconf = require('nconf');
const cjson = require('cjson');
const chalk = require('chalk');
const {version} = require('./package.json');

nconf.use('memory').argv().env();
const configFile = nconf.get('CONFIG_FILE') || nconf.get('config_file') || 'config.json';
nconf.defaults(readConfig(configFile));
nconf.set('port', nconf.get('PORT') || nconf.get('port') || 3000)
nconf.set('testmode', nconf.get('TESTMODE') || nconf.get('testmode'));
verifyConfig(nconf);

if (nconf.get('version')) {
  console.log(version);
  process.exit();
}

if (nconf.get('help')) {
  console.log('Options:');
  console.log('  --help        - Prints this usage info');
  console.log('  --port n      - Listen port number for HTTP server (default: 3000)');
  console.log("  --testmode    - Simulate serial port activity, don't open real ports");
  console.log('  --version     - Prints server version number');
  process.exit();
}

const server = require('./lib/server.js');
server.start(nconf).catch(console.error);

function readConfig(file) {
  if (!fs.existsSync('./config.json')) {
    console.warn(chalk.red.bold(`Could not find ${file}. Please copy` +
      ` ${file}.example to ${file}) and edit it.`));
    throw new Error(`File not found: ${file}`)
  }

  return cjson.load(file);
}

function verifyConfig(config) {
  const ports = config.get('serialPorts');
  if (!ports || !Array.isArray(ports) || !ports.length) {
    console.warn(`No serial ports configured! Please specify serial port(s) in ${configFile}.`);
    throw new Error('Serial ports not configured.');
  }
}
