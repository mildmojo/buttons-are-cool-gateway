'use strict';
const fs = require('fs');
const EventEmitter = require('events').EventEmitter;
const express = require('express');
const SerialPort = require('serialport/test');
const MockBinding = SerialPort.Binding; // DEBUG
const cjson = require('cjson');
const xml2js = require('xml2js');
const config = cjson.load('./config.json');
const ButtonStatus = require('./buttonStatus');
const app = express();
config.serialPorts.forEach(p => MockBinding.createPort(p)); // DEBUG

let buttonStatus = null;
let ports = [];
debugger;
init().catch(console.error);

async function init() {
  let mappings = [];
  let portNames = [];

  config.serialPorts.forEach(async (portName, i) => {
    let xml = await readFile(config.mappingFiles[i]).catch(console.error);
    let parsedXML = await parseXML(xml).catch(console.error);
    // let xml = ''; //await readFile(config.mappingFiles[i]).catch(console.error);
    // let parsedXML = {ArrayOfInt: {int: [0]  }}; //await parseXML(xml).catch(console.error);
    mappings.push(parsedXML.ArrayOfInt.int);
    portNames.push(portName);
  });

  buttonStatus = new ButtonStatus(mappings);

  portNames.forEach(portName => {
    let port = new SerialPort(portName, { baudrate: 9600 });
    port.on('open', port.binding.emitData(Buffer.from([0,0,0,0,0,0,0,1]))); // DEBUG

    port.on('data', chunk => {
      buttonStatus.update(i, chunk);
    });

    port.on('error', err => console.warn(`Error: ${err}`));

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

app.get('/buttons', (req, res, done) => {
  res.send(buttonStatus.toJSON());
});


app.listen(3000);
