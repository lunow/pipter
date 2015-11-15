var express = require('express');
var app = express();
var fs = require('fs');
var cp = require('cp');
var runner = require('./runner.js');

var Pipter = function() {
	var my = {};
	var that = {};

	my.construct = function() {
		return that;
	};

	my.imageToState = function(image) {
		return image.split('.png')[0];
	};

	that.list = function() {
		var reference = fs.readdirSync('screenshots/reference');
		return reference;
	};

	that.refresh = function(image, cb) {
		var state = my.imageToState(image);
		runner(state, function() {
			cb(image);
		});
	};

	that.accept = function(image, cb) {
		cp('screenshots/current/'+image, 'screenshots/reference/'+image, function(err) {
			if(err) {
				console.log('copying failed', err);
			}
			cb(image);
		});
	};

	return my.construct();
};

var myPipter = Pipter();

app.use(express.static('client'));
app.use(express.static('node_modules'));
app.use(express.static('screenshots'));

app.get('/api/index', function(req, res) {
	res.send(myPipter.list());
});

app.get('/api/refresh', function(req, res) {
	myPipter.refresh(req.query.image, function(image) {
		res.send(image);
	});
});

app.get('/api/accept', function(req, res) {
	myPipter.accept(req.query.image, function(image) {
		res.send(image);
	});
});

app.listen(4040);
console.log('Pipter Server is running on Port 4040');
console.log('http://localhost:4040');