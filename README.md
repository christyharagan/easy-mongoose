Mongoose Builder
=======

Overview
------

Convenience library for building Mongoose schemas and models, and working with connections

Usage
------

Install:

```
npm install easy-mongoose
```

To create a schema:

```javascript

var typeBuilder = require('easy-mongoose').typeBuilder;

// Specify a namespace for the schemas
var schemas = typeBuilder.schemas('myNamespace');

schemas

// Create two schema elements, "adult" and "child"
  ('child', {
    name: {type: String, required: true, unique: true},
    description: String
  })
  ('adult', {
    name: {type: String, required: true, unique: true},
    children: [
      schemas.ref('child')
    ]
  })

// Export "adult" as a model element, but not "child"
  (['adult']);
```

Then to consume those schemas as models:

```javascript
var dbConnection = require('easy-mongoose').dbConnection;

dbConnection(dbUrl, 'myNamespace').then(function (db) {
  var Adult = db.getModel('adult');
  // ...
}).catch(function(e){
  // oh noes
});

```
