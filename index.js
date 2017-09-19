'use strict';
const fs = require('fs');
const express = require('express');
// const SerialPort = require('serialport/test');
const SerialPort = require('serialport');
// const MockBinding = SerialPort.Binding; // DEBUG
const chalk = require('chalk');
const cjson = require('cjson');
const xml2js = require('xml2js');
const ButtonStatus = require('./lib/buttonStatus');
const app = express();
// config.serialPorts.forEach(p => MockBinding.createPort(p)); // DEBUG

let buttonStatuses = [];
let ports = [];

if (!fs.existsSync('./config.json')) {
  console.warn(chalk.red.bold('Could not find config.json. Please copy' +
    ' config.json.example to config.json and edit it.'));
  process.exit(1);
}

const config = cjson.load('./config.json');

if (!config.serialPorts || !config.serialPorts.length) {
  console.warn('No serial ports configured! Please specify serial port(s) in config.json.');
  process.exit(1);
}

init().catch(console.log);

async function init() {
  let mappings = [];
  let portNames = [];

  for (let i = 0; i < config.serialPorts.length; i++) {
    let portName = config.serialPorts[i];
    let xml = await readFile(config.mappingFiles[i]).catch(console.error);
    let parsedXML = await parseXML(xml).catch(console.error);
    mappings.push(parsedXML.ArrayOfInt.int);
    portNames.push(portName);
  }

  portNames.forEach((portName, portIdx) => {
    let port = new SerialPort(portName, { baudrate: 9600 });
    port.on('open', () => {
      port.on('data', chunk => {
        buttonStatuses[portIdx].update(chunk);
      });

      port.on('error', err => console.warn(`Error: ${err}`));

      // port.binding.emitData(Buffer.from([0,0,0,0,0,0xFE,0xFE,1])); // DEBUG
    });


    buttonStatuses.push(new ButtonStatus(mappings[portIdx]));
    ports.push(port);
  });
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function parseXML(xml) {
  return new Promise((resolve, reject) => {
    let xmlParser = new xml2js.Parser();
    xmlParser.parseString(xml, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}


app.use('/', express.static('./public'));

app.get('/buttons', (_req, res) => {
  let status = { devices: [] };
  buttonStatuses.forEach((buttonStatus, idx) => {
    status.devices[idx] = buttonStatus.toJSON();
    status.devices[idx].name = config.serialPorts[idx];
  });
  res.send(JSON.stringify(status, null, ' '));
});


let port = process.env.PORT || config.port || 3000;
console.log(chalk.yellow.bold(`Starting server on port ${port}...`));
console.log(chalk.blue.bold(`Visit http://localhost:${port}/ to see a demo status page.`));
app.listen(port);
