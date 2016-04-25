/* jshint node:true */

'use strict';

exports = module.exports = {
    init: init,
    commit: commit,
    set: set,
    get: get,
    del: del
};

var fs = require('fs');

var gData = null;
var gPath = '';

function init(path) {
    if (gData) return;

    console.log('loading database from ', path);

    gData = JSON.parse(fs.readFileSync(path, 'utf-8'));
    gPath = path;
}

function commit() {
    console.log('save db', gPath, gData);

    fs.writeFileSync(gPath, JSON.stringify(gData));
}

function get(type, key) {
    if (typeof key === 'undefined') return gData[type];

    if (typeof gData[type] === 'undefined') gData[type] = {};

    return gData[type][key];
}

function set(type, key, value) {
    if (!gData[type]) gData[type] = {};

    gData[type][key] = value;

    commit();
}

function del(type, key) {
    if (!gData[type]) return;
    delete gData[type][key];

    commit();
}