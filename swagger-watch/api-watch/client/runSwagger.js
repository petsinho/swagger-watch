
var express = require('express');
var argv = require('minimist')(process.argv.slice(2));
var swagger = require("swagger-node-express");
var bodyParser = require('body-parser');
var path = require('path');


var app = express();
var subpath = express();

app.use(bodyParser());
app.use("/v1", subpath);

swagger.setAppHandler(subpath);

app.use(express.static('./'))


//TODO : edit the api info accordingly
swagger.setApiInfo({
    title: "__$API_TITLE$__",
    description: "__$API_DESC$__",
    termsOfServiceUrl: "",
    contact: "devz@aacctt.org",
    license: "",
    licenseUrl: "",
    jsonEditor: true
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));

});

// Set api-doc path
swagger.configureSwaggerPaths('', 'api-docs', '');

// Configure the API domain
var domain = 'localhost';
if (argv.domain !== undefined)
    domain = argv.domain;
else
    console.log('No --domain=xxx specified, taking default hostname "localhost".')

// Configure the API port
var port = "__$PORT$__";
if (argv.port !== undefined)
    port = argv.port;
else
    console.log('No --port=xxx specified, taking default port ' + port + '.')

// Set and display the application URL
var applicationUrl = 'http://' + domain + ':' + port;
console.log('there you go, ACT API running on: ' + applicationUrl);

swagger.configure(applicationUrl, '1.0.0');

// Start the web server
app.listen(port);