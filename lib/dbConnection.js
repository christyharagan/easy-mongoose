'use strict';

var typeBuilder = require('./typeBuilder');
var mongoose = require('mongoose');
var Promise = require('bluebird').Promise;

module.exports = function (url, schemaNamespace, options) {
  return new Promise(function (resolve, reject) {
    var db = mongoose.createConnection(url, options);
    var models;

    db.getModel = function (modelName) {
      return models[modelName];
    };

    db.once('open', function () {
      models = typeBuilder.models(db, schemaNamespace);
      resolve(db);
    });
    db.on('error', reject);
  });
};

module.exports.disconnect = function () {
  mongoose.disconnect();
};
