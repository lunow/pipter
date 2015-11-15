/* global require, console */

console.log('----------- Pipter ----------');
console.log('Pixel Perfect Frontend Tester');

var _ = require('lodash');
var async = require('async');

var webdriverjs = require('webdriverjs-angular'),
	client = webdriverjs.remote({
		desiredCapabilities: {
			browserName: 'chrome',
			// chromeOptions: {
			// 	args: ['no-startup-window']
			// }
		},
		ngRoot: 'body'
	});

var runner = function(force_state, cb) {
	client
		.init()
		.setViewportSize({ width: 1280, height: 800 })
		.url('http://localhost:8100')
		.execute(function() {
			var urls = [];
			var $state = angular.element('body').injector().get('$state');
			_.each($state.get(), function(state) {
				if(!state.abstract) {
					urls.push({
						url: $state.href(state.name, {}, { absolute: true }),
						name: state.name,
						state: state
					});
				}
			});
			return urls;
		}).then(function(response) {
			var list = [];
			console.log('got state', force_state);
			if(force_state) {
				list.push(_.find(response.value, function(state) {
					if(state.name == force_state) {
						return state;
					}
				}));
			}
			else {
				list = response.value;
			}
			console.log('found', _.size(list), list, 'states');
			async.forEachOfSeries(list, function(state, key, callback) {
				console.log('create screenshot for', state.url+'...');
				client
					.url(state.url)
					.saveScreenshot(__dirname + '/screenshots/current/'+state.name+'.png')
					.then(function() {
						console.log('done!');
						callback();
					});
			}, function() {
				console.log('okay, all done!');
				client.end();
				if(cb) {
					cb();
				}
			});
		});
};

module.exports = runner;