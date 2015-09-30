# swint-fork
Process behaviour(fork, common/separate execution of code chunk, etc.) manager for Swint

**Warning: This is not the final draft yet, so do not use this until its official version is launched**

## Installation
```sh
$ npm install --save swint-fork
```

## Options
* `preProcess`: `Function`
  * `fork`: swint-fork instance
  * `cb`: callback when `preProcess` ended
* `postProcess`: `Function`
  * `fork`: swint-fork instance
  * `cb`: callback when `postProcess` ended
* `onExit`: `Function`, executed when child process died
* `numFork`: `Number`, default: # of CPU logical core
* `operator`: swint-proc-ops instance, default: `null`

## Usage
```javascript
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
		operator: swintProcOps({
			server: {
				enabled: true
			},
			keyBind: {
				enabled: true
			}
		})
	});
```
