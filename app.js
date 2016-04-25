#!/usr/bin/env node

/* jshint node:true */

'use strict';

var express = require('express'),
    bodyParser = require('body-parser'),
    routes = require('./routes.js'),
    database = require('./database.js');

var PORT = 3000;

var app = express();
var router = express.Router();

router.post('/users', routes.addUser);
router.get ('/users', routes.verifyToken, routes.getUser);
router.delete ('/users', routes.verifyToken, routes.deleteUser);

router.post('/login', routes.login);

router.post('/messages', routes.verifyToken, routes.sendMessage);
router.get ('/messages', routes.verifyToken, routes.getMessages);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(router);

app.listen(PORT, function () {
    console.log('Server listening on port', PORT);
});

database.init(__dirname + '/db.json');
