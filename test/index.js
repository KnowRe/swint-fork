var assert = require('assert'),
	request = require('request'),
	swintFork = require('../lib'),
	swintProcOps = require('swint-proc-ops');

global.swintVar.printLevel = 5;

describe('Simple fork', function() {
	var fork;

	before(function(done) {
		fork = swintFork({
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
			numFork: 1,
			operator: swintProcOps({
				server: {
					enabled: true
				},
				keyBind: {
					enabled: false
				}
			})
		});

		setTimeout(function() {
			done();
		}, 200);
	});

	it('health check', function(done) {
		request.get({
			url: 'https://localhost:33233/healthCheck?pass=SwintIsForTwins',
			strictSSL: false
		}, function(err, resp, body) {
			var pBody = JSON.parse(body);

			assert.ok(pBody.success);
			assert.equal(pBody.error, '');
			assert.ok(Array.isArray(pBody.data.processes));
			
			done();
		});
	});

	it('soft reset', function(done) {
		request.get({
			url: 'https://localhost:33233/softReset?pass=SwintIsForTwins',
			strictSSL: false
		}, function(err, resp, body) {
			assert.deepEqual(JSON.parse(body), {
				success: true,
				error: '',
				data: {
					message: "Soft reset has successfully done"
				}
			});
			done();
		});
	});

	it('hard reset', function(done) {
		request.get({
			url: 'https://localhost:33233/hardReset?pass=SwintIsForTwins',
			strictSSL: false
		}, function(err, resp, body) {
			assert.deepEqual(JSON.parse(body), {
				success: true,
				error: '',
				data: {
					message: "Hard reset has successfully done"
				}
			});
			done();
		});
	});
});
