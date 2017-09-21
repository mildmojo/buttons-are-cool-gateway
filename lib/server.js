'use strict';
const fs = require('fs');
const http = require('http');
const express = require('express');
const WebSocket = require('ws');
// const SerialPort = require('serialport/test');
const SerialPort = require('serialport');
const chalk = require('chalk');
const cjson = require('cjson');
const xml2js = require('xml2js');
const ButtonStatus = require('./buttonStatus');
const CONFIG_FILE = process.env.CONFIG_FILE || 'config.json';

module.exports = {start};

async function start() {
  // Read config
  // Verify config
  // Read mappings
  // Create button status instances
  // Initialize serial ports
  // Bind serial ports to button status instances
  // Bind web app to button status instances

  const config = readConfig(CONFIG_FILE);
  if (!verifyConfig(config)) process.exit(1);
  const mappings = await readMappings(config.mappingFiles);
  const buttonStatuses = createButtonStatuses(config.serialPorts.length, mappings);
  const ports = openSerialPorts(config.serialPorts);

  for (let i = 0; i < ports.length; i++) {
    ports[i].on('data', chunk => buttonStatuses[i].update(chunk));
  }

  const app = startApp(config, buttonStatuses);
  const httpServer = http.createServer(app);
  const wsServer = startWebSocketServer(config, httpServer, buttonStatuses);

  let port = process.env.PORT || config.port || 3000;
  console.log(chalk.yellow.bold(`Starting server on port ${port}...`));
  console.log(chalk.blue.bold(`Visit http://localhost:${port}/ to see a demo status page.`));
  httpServer.listen(port, function listening() {
    console.log('Listening on %d', httpServer.address().port);
  });
}

function readConfig(file) {
  if (!fs.existsSync('./config.json')) {
    console.warn(chalk.red.bold(`Could not find ${file}. Please copy` +
      ` ${file}.example to ${file}) and edit it.`));
    throw new Error(`File not found: ${file}`)
  }

  return cjson.load(file);
}

function verifyConfig(config) {
  if (!config.serialPorts || !config.serialPorts.length) {
    console.warn(`No serial ports configured! Please specify serial port(s) in ${CONFIG_FILE}.`);
    return false;
  }
  return true;
}

async function readMappings(mappingFiles) {
  const mappings = [];
  for (let file of mappingFiles) {
    const parsedXML = await readFileXML(file);
    mappings.push(parsedXML.ArrayOfInt.int);
  }
  return mappings;
}

function createButtonStatuses(count, mappings) {
  return [...Array(count)].map((_v, idx) => new ButtonStatus(mappings[idx]));
}

function openSerialPorts(portNames) {
  return portNames.map(portName => {
    let serial = null;

    if (process.env.TESTMODE) {
      const SerialPortTest = require('serialport/test');
      const MockBinding = SerialPortTest.Binding; // DEBUG
      MockBinding.createPort(portName);
      serial = new SerialPortTest(portName, { baudrate: 9600 });
      // Randomly update button states.
      setInterval(() => {
        let randomVals = [...Array(7)].map(() => (Math.ceil(Math.random() * 0xFF)) & 0xFE);
        randomVals[randomVals.length - 1] += 1;
        serial.binding.emitData(Buffer.from(randomVals));
      }, 50);
    } else {
      serial = new SerialPort(portName, { baudrate: 9600 });
    }

    serial.on('error', err => console.warn(`Error with port ${portName}: ${err}`));

    return serial;
  });
}

function startApp(config, buttonStatuses) {
  const app = express();
  app.disable('x-powered-by');

  // Set proper CORS headers to allow browsers to use this resource from anywhere.
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  app.use('/', express.static('./public'));

  app.get('/buttons', (_req, res) => {
    let status = { testMode: !!process.env.TESTMODE, devices: [] };
    buttonStatuses.forEach((buttonStatus, idx) => {
      status.devices[idx] = buttonStatus.toJSON();
      status.devices[idx].name = config.serialPorts[idx];
    });
    res.send(JSON.stringify(status, null, ' '));
  });

  return app;
}

function startWebSocketServer(config, httpServer, buttonStatuses) {
  const wsServer = new WebSocket.Server({ server: httpServer });

  wsServer.on('connection', socket => socket.send(JSON.stringify({name: 'testMode', isTestMode: !!process.env.TESTMODE})))

  wsServer.broadcast = function broadcast(data) {
    wsServer.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  for (var i = 0; i < buttonStatuses.length; i++) {
    buttonStatuses[i].on('buttonDown', createMessageSender('buttonDown', i, config.serialPorts[i], wsServer));
    buttonStatuses[i].on('buttonUp', createMessageSender('buttonUp', i, config.serialPorts[i], wsServer));
  }

  return wsServer;
}

function createMessageSender(name, deviceIdx, deviceName, wsServer) {
  return buttonNum => {
    const message = {
      name: name,
      deviceNum: deviceIdx,
      deviceName: deviceName,
      buttonNum: buttonNum
    };
    wsServer.broadcast(JSON.stringify(message));
  };
}

async function readFileXML(xmlFile) {
  const xml = await readFile(xmlFile);
  const parsedXML = await parseXML(xml);
  return parsedXML;
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

