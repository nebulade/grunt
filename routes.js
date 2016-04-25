/* jshint node:true */

'use strict';

exports = module.exports = {
    getUser: getUser,
    login: login,
    addUser: addUser,
    deleteUser: deleteUser,
    verifyToken: verifyToken,
    sendMessage: sendMessage,
    getMessages: getMessages
};

var database = require('./database.js'),
    passwordHash = require('password-hash'),
    gpg = require('gpg'),
    uuid = require('node-uuid');

function verifyToken(req, res, next) {
    if (!req.query.token) return res.status(400).send('Missing token');

    var username = database.get('tokens', req.query.token);
    if (!username) return res.status(401).end();

    var user = database.get('users', username);
    if (!user) return res.status(401).end();

    req.user = user;

    next();
}

function getUser(req, res) {
    res.status(200).send(req.user);
}

function deleteUser(req, res) {
    database.del('users', req.user.username);
}

function addUser(req, res) {
    if (!req.body) return res.status(400).send('Missing json body');
    if (!req.body.username) return res.status(400).send('Missing username');
    if (!req.body.password) return res.status(400).send('Missing password');

    var user = {
        username: req.body.username,
        hashedPassword: passwordHash.generate(req.body.password)
    };

    database.set('users', user.username, user);

    res.status(201).end();
}

function login(req, res) {
    if (!req.body) return res.status(400).send('Missing json body');
    if (!req.body.username) return res.status(400).send('Missing username');
    if (!req.body.password) return res.status(400).send('Missing password');

    var user = database.get('users', req.body.username);
    if (!user) return res.status(404).end();

    if (!passwordHash.verify(req.body.password, user.hashedPassword)) return res.status(401).end();

    var token = uuid.v4();
    database.set('tokens', token, user.username);

    res.status(200).send({ token: token });
}

function sendMessage(req, res) {
    if (!req.body) return res.status(400).send('Missing json body');
    if (!req.body.recipient) return res.status(400).send('Missing recipient');
    if (!req.body.message) return res.status(400).send('Missing message');

    var messages = database.get('messages', req.body.recipient) || [];

    messages.push(req.body.message);

    database.set('messages', req.body.recipient, messages);

    res.status(201).end();
}

function getMessages(req, res) {
    var messages = database.get('messages', req.user.username) || [];

    res.status(200).send({ messages: messages });
}
