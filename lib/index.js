'use strict';

var cluster = require('cluster'),
	async = require('async'),
	os = require('os'),
	swintHelper = require('swint-helper'),
	print = swintHelper.print,
	EventEmitter = require('events').EventEmitter,
	defaultize = swintHelper.defaultize;

module.exports = function(options) {
	defaultize({
		preProcess: function(fork, cb) {
			cb({});
		},
		postProcess: function(fork, sharedData, cb) {
			cb({});
		},
		onCreateWorker: function(/*fork, worker*/) {
		},
		onExit: function( /* fork */ ) {
		},
		numFork: os.cpus().length,
		operator: null
	}, options);

	return new Fork(options);
};

var Fork = function(options) {
	this.options = options;
	this.sharedData = null;
	this.evt = new EventEmitter();
	this.start();
};

var _ = Fork.prototype;

_.start = function() {
	var that = this;

	if (cluster.isMaster) {
		if (this.options.operator !== null) {
			this.options.operator.start(function() {
				that.startPreProcess();
			});
		} else {
			this.startPreProcess();
		}
	} else if (cluster.isWorker) {
		process.send({
			type: 'ready'
		});
	}

	process.on('message', function(msg) {
		switch (msg.type) {
			case 'control':
				switch (msg.data) {
					case 'healthCheck':
						that.monitor(function(err, res) {
							if (err) {
								print(4, err);
								process.exit(-1);
								return;
							}
							process.emit('controlEnd', null, res);
						});
						break;
					case 'softReset':
						that.resetPost(function(err) {
							if (err) {
								print(4, err);
								process.exit(-1);
								return;
							}
							process.emit('controlEnd');
						});
						break;
					case 'hardReset':
						that.resetAll(function(err) {
							if (err) {
								print(4, err);
								process.exit(-1);
								return;
							}
							process.emit('controlEnd');
						});
						break;
				}
				break;
			case 'data':
				that.options.postProcess(that, msg.data, function() {
					process.send({
						type: 'complete'
					});
				});
				break;
		}
	});
};

_.startPreProcess = function() {
	var that = this,
		numFork = this.options.numFork;

	this.options.preProcess(this, function(sharedData) {
		that.sharedData = sharedData;
		for (var i = 0; i < numFork; i++) {
			that.createWorker(sharedData);
		}
	});

	cluster.on('exit', function(worker) {
		print(2, 'Worker ' + worker.process.pid + ' died');
		that.options.onExit(that);
		that.createWorker(that.sharedData);
	});

	cluster.on('error', function(worker) {
		worker.kill();
	});

	cluster.on('disconnect', function(worker) {
		worker.kill();
	});
};

_.createWorker = function(sharedData) {
	var that = this,
		worker = cluster.fork();

	worker.on('message', function(msg) {
		if (msg.type === 'complete') {
			that.evt.emit('complete');
		} else if (msg.type === 'ready') {
			worker.send({
				type: 'data',
				data: sharedData
			});
		}
	});

	this.options.onCreateWorker(this, worker);
	
	return worker;
};

_.monitor = function(callback) {
	var processes = [];

	for (var id in cluster.workers) {
		var worker = cluster.workers[id];

		processes.push({
			id: id,
			pid: worker.process.pid
		});
	}

	callback(null, processes);
};

_.resetAll = function(callback) {
	var that = this;

	if (that.resetFlag) return;

	that.resetFlag = true;

	that.options.preProcess(that, function() {
		var workers = [];

		for (var id in cluster.workers) {
			var worker = cluster.workers[id];

			workers.push(worker);
		}

		async.series(
			workers.map(function(v) {
				return function(cb) {
					that.evt.once('complete', function() {
						cb(null, true);
					});
					v.kill();
				};
			}),
			function(err) {
				that.resetFlag = false;
				callback(err, true);
			}
		);
	});
};

_.resetPost = function(callback) {
	var that = this,
		workers = [];

	if (that.resetFlag) return;

	that.resetFlag = true;

	for (var id in cluster.workers) {
		var worker = cluster.workers[id];

		workers.push(worker);
	}

	async.series(
		workers.map(function(v) {
			return function(cb) {
				that.evt.once('complete', function() {
					cb(null, true);
				});
				v.kill();
			};
		}),
		function(err) {
			that.resetFlag = false;
			callback(err, true);
		}
	);
};

