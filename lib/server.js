'use strict';
const fs = require('fs');
const http = require('http');
const EventEmitter = require('events').EventEmitter;
const express = require('express');
const WebSocket = require('ws');
const SerialPort = require('serialport');
const chalk = require('chalk');
const xml2js = require('xml2js');
const ButtonStatus = require('./buttonStatus');

module.exports = {start};

// Expects a config object with a .get() function for looking up values by key.
async function start(config) {
  // Read config
  // Verify config
  // Read mappings
  // Create button status instances
  // Initialize serial ports
  // Bind serial ports to button status instances
  // Bind web app to button status instances

  const mappings = await readMappings(config.get('mappingFiles'));
  const buttonStatuses = createButtonStatuses(config.get('serialPorts').length, mappings);
  const serialPorts = openSerialPorts(config.get('serialPorts'));
  const serverPort = config.get('port');

  for (let i = 0; i < serialPorts.length; i++) {
    serialPorts[i].on('data', chunk => buttonStatuses[i].update(chunk));
  }

  const app = startApp(config, buttonStatuses);
  const httpServer = http.createServer(app);
  const wsServer = startWebSocketServer(config, httpServer, buttonStatuses);

  console.log(chalk.yellow(`Starting server on port ${serverPort}...`));
  httpServer.listen(serverPort, function listening() {
    console.log(chalk.yellow.bold(`Server started on port ${httpServer.address().port}.`));
    console.log(chalk.blue.bold(`Visit http://localhost:${serverPort}/ to see a demo status page.`));
  });
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

function openSerialPorts(portNames, testmode) {
  return portNames.map(portName => {
    let serial = null;

    if (testmode) {
      serial = new EventEmitter();
      serial.send = serial.emit;
      // Randomly update button states.
      setInterval(() => {
        let randomVals = [...Array(7)].map(() => (Math.ceil(Math.random() * 0xFF)) & 0xFE);
        randomVals[randomVals.length - 1] += 1;
        serial.emit('data', Buffer.from(randomVals));
      }, 50);
    } else {
      serial = new SerialPort(portName, { baudrate: 9600 });
    }

    serial.on('error', err => {
      console.warn(`Error with port ${portName}: ${err}`);
      SerialPort.list()
        .then(portList => {
          console.log("Make sure you've configured the right ports. Maybe paste" +
            " one or more of these into 'config.json':");
          for (let port of portList) {
            let attrs = Object.keys(port).reduce((sum, key) => port[key] ? sum.concat(`${key}: ${port[key]}`) : sum, []);
            console.log(`"${port.comName}", // ${attrs.join(', ')}`);
          }
        });
    });

    return serial;
  });
}

function startApp(config, buttonStatuses) {
  const testmode = config.get('testmode');
  const serialPorts = config.get('serialPorts');
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
    let status = { testmode: testmode, devices: [] };
    buttonStatuses.forEach((buttonStatus, idx) => {
      status.devices[idx] = buttonStatus.toJSON();
      status.devices[idx].name = serialPorts[idx];
    });
    res.send(JSON.stringify(status, null, ' '));
  });

  return app;
}

function startWebSocketServer(config, httpServer, buttonStatuses) {
  const testmode = config.get('testmode');
  const serialPorts = config.get('serialPorts');
  const wsServer = new WebSocket.Server({ server: httpServer });

  wsServer.on('connection', (socket, req) => {
    socket.send(JSON.stringify({name: 'testMode', isTestMode: testmode}));
    console.log(chalk.cyan(`WebSocket client connected! (${req.connection.remoteAddress})`));
  });

  wsServer.broadcast = function broadcast(data) {
    wsServer.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  for (var i = 0; i < buttonStatuses.length; i++) {
    buttonStatuses[i].on('buttonDown', createMessageSender('buttonDown', i, serialPorts[i], wsServer));
    buttonStatuses[i].on('buttonUp', createMessageSender('buttonUp', i, serialPorts[i], wsServer));
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

