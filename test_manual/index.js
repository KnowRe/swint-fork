var assert = require('assert'),
	request = require('request'),
	swintFork = require('../lib'),
	swintProcOps = require('swint-proc-ops');

var fork = swintFork({
		preProcess: function(fork, cb) {
			cb({
				foo: 'bar'
			});
		},
		postProcess: function(fork, sharedData, cb) {
			print(sharedData.foo);

			cb({});
		},
		onExit: function(fork) {
			print('process killed');
		},
		numFork: 4,
		operator: swintProcOps({
			server: {
				enabled: true
			},
			keyBind: {
				enabled: true
			}
		})
	});
