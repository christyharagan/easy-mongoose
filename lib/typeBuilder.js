'use strict';

var _ = require('underscore');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var allSchemas = {};
var allSchemasForModels = {};

var buildDefinition = function (namespace, name, mixins, d) {
  var definition = {};
  mixins.forEach(function (mixinName) {
    var sameNamespace = false;

    var fqMixinName;
    var mixinNamespace;
    var dot = mixinName.indexOf('.');
    if (dot === -1) {
      sameNamespace = true;
      mixinNamespace = namespace;
      fqMixinName = mixinNamespace + '.' + mixinName;
    } else {
      fqMixinName = mixinName;
      mixinNamespace = fqMixinName.substring(0, dot);
      mixinName = fqMixinName.substring(dot + 1);
    }

    var depSchemas = allSchemas[mixinNamespace][1];
    if (!depSchemas) {
      throw new Error('Dependent schema namespace ' + mixinNamespace + ' for schema ' + namespace + '.' + name + ' not found');
    }
    var depSchema = depSchemas[mixinName];
    if (!depSchema) {
      throw new Error('Dependent schema ' + fqMixinName + ' for schema ' + namespace + '.' + name + ' not found');
    }
    var depSchemaDef = depSchema[1];
    _.each(depSchemaDef, function (value, property) {
      definition[property] = value;
    });
    if (depSchema[2]) {
      if (sameNamespace) {
        definition['_' + mixinName] = {type: String, required: true, default: name};
      } else {
        definition['_' + fqMixinName] = {type: String, required: true, default: namespace + '.' + name};
      }
    }
  });

  _.each(d, function (value, property) {
    definition[property] = value;
  });

  return definition;
};

exports.schemas = function (namespace) {
  var schemas = allSchemas[namespace];
  if (!schemas) {
    schemas = [function (name, mixins, isAbstract, definition) {
      if (arguments.length === 1) {
        allSchemasForModels[namespace] = name;
        return;
      } else if (arguments.length === 2) {
        definition = mixins;
        isAbstract = false;
        mixins = [];
      } else if (arguments.length === 3) {
        definition = isAbstract;
        if (_.isBoolean(mixins)) {
          isAbstract = mixins;
          mixins = [];
        } else {
          isAbstract = false;
        }
      }
      definition = buildDefinition(namespace, name, mixins, definition);
      var schema = new Schema(definition);

      schemas[1][name] = [schema, definition, isAbstract];

      return schemas[0];
    }, {}];

    schemas[0].ref = function (name) {
      var dot = name.indexOf('.');
      return { type: Schema.Types.ObjectId, ref: dot === -1 ? namespace + '.' + name : name };
    };

    allSchemas[namespace] = schemas;
  }

  return schemas[0];
};

exports.schema = function (namespace, name) {
  var schemas = allSchemas[namespace];
  if (!schemas) {
    throw new Error('Schema namespace' + namespace + ' not found');
  }

  var schema = schemas[name];
  if (!schema) {
    throw new Error('Schema ' + namespace + '.' + name + ' not found');
  } else {
    return schema[0];
  }
};

exports.model = function (db, namespace, name) {
  return db.model(name, exports.schema(namespace, name));
};

exports.models = function (db, namespace) {
  var models = {};
  var schemas = allSchemas[namespace];
  if (!schemas) {
    throw new Error('Schema namespace ' + namespace + ' not found');
  }
  var schemaNames = allSchemasForModels[namespace];

  for (var i = 0; i < schemaNames.length; i++) {
    var schemaName = schemaNames[i];
    models[schemaName] = db.model(namespace + '.' + schemaName, schemas[1][schemaName][0]);
  }

  return models;
};

exports.Schema = Schema;