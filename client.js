#!/usr/bin/env node

/* jshint node:true */

'use strict';

var superagent = require('superagent'),
    gpg = require('gpg'),
    fs = require('fs');

var SERVER = 'http://localhost:3000';
var CONFIG_FILE = 'dude.token';

console.log(process.argv);

var command = process.argv[2];

var gToken = null;
try {
    gToken = fs.readFileSync(CONFIG_FILE).toString();
} catch (e) {}

function exit(message) {
    if (message) console.error(message);
    process.exit(message ? 1 : 0);
}

if (command === 'create') {
    var username = process.argv[3];
    var password = process.argv[4];

    superagent.post(SERVER + '/users').send({ username: username, password: password }).end(function (error, result) {
        if (error) exit('unable to create user');

        superagent.post(SERVER + '/login').send({ username: username, password: password }).end(function (error, result) {
            if (error) exit('unable to create token');

            console.log('token: %s', result.body.token);

            fs.writeFileSync(CONFIG_FILE, result.body.token);
        });
    });
} else if (command === 'login') {
    var username = process.argv[3];
    var password = process.argv[4];

    superagent.post(SERVER + '/login').send({ username: username, password: password }).end(function (error, result) {
        if (error) exit('unable to create token');

        console.log('token: %s', result.body.token);

        fs.writeFileSync(CONFIG_FILE, result.body.token);
    });
} else if (command === 'send') {
    if (!gToken) exit('login first');

    var recipient = process.argv[3];
    var message = process.argv[4];

    // encrypt message
    var args = [
        '--default-key', '9DEE4665',
        '--recipient', '9DEE4665',
        '--armor',
        '--trust-model', 'always' // so we don't get "no assurance this key belongs to the given user"
    ];

    gpg.encrypt(message, args, function (error, encryptedMessage) {
        if (error) exit('Unable to encrypt message ' + error);

        superagent.post(SERVER + '/messages').query({ token: gToken }).send({ message: encryptedMessage.toString(), recipient: recipient }).end(function (error, result) {
            if (error) exit('unable to send message');
            console.log('Success');
        });
    });
} else if (command === 'receive') {
    if (!gToken) exit('login first');

    superagent.get(SERVER + '/messages').query({ token: gToken }).end(function (error, result) {
        if (error) exit('unable to fetch messages');
        console.log('Success', result.body.messages);

        result.body.messages.forEach(function (msg) {
            gpg.decrypt(msg, function (error, result) {
                if (error) return console.log(msg);

                console.log(result.toString());
            });
        });
    });
}
