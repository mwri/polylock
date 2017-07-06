(function () {


"use strict";


let polylock;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	polylock = require('./../dist/polylock.js');
	require('chai-jasmine');
} else {
	polylock = window.polylock;
}


describe('readme', function() {

	it('works', function (test_done) {

		let resource_manager = new polylock();

		let prom = resource_manager.exec(function (done, fail) {
			// locks have been granted
			console.log("starting operation");
			if (true === false) {
				// this is a (synchronous) bug in the operation
				throw new Error('tarantula');
			}
			setTimeout(function () {
				if (true === false) {
					// this is an asynchronous bug in the operation
					fail(new Error('hornet'));
				}
				let retval = Math.floor(Math.random()*10);
				console.log("finishing operation (returning "+retval+")");
				// finish the operation
				done(retval);
				// locks are released
			}, 1000);
		}, {'resource_a': 'read', 'resource_b': 'write'});

		prom.then(function (val) {
			// operation has been finished
			console.log("operation done, result was "+val);
			test_done();
		}).catch(function (err) {
			console.log('mayday mayday, its all gone wrong: '+err);
			test_done.fail();
		});

	});

	it('fails (sync)', function (test_done) {

		let resource_manager = new polylock();

		let prom = resource_manager.exec(function (done, fail) {
			// locks have been granted
			console.log("starting operation");
			if (true === true) {
				// this is a (synchronous) bug in the operation
				throw new Error('tarantula');
			}
			setTimeout(function () {
				if (true === false) {
					// this is an asynchronous bug in the operation
					fail(new Error('hornet'));
				}
				let retval = Math.floor(Math.random()*10);
				console.log("finishing operation (returning "+retval+")");
				// finish the operation
				done(retval);
				// locks are released
			}, 1000);
		}, {'resource_a': 'read', 'resource_b': 'write'});

		prom.then(function (val) {
			// operation has been finished
			console.log("operation done, result was "+val);
			test_done.fail();
		}).catch(function (err) {
			console.log('mayday mayday, its all gone wrong: '+err);
			test_done();
		});

	});

	it('fails (async)', function (test_done) {

		let resource_manager = new polylock();

		let prom = resource_manager.exec(function (done, fail) {
			// locks have been granted
			console.log("starting operation");
			if (true === false) {
				// this is a (synchronous) bug in the operation
				throw new Error('tarantula');
			}
			setTimeout(function () {
				if (true === true) {
					// this is an asynchronous bug in the operation
					fail(new Error('hornet'));
				}
				let retval = Math.floor(Math.random()*10);
				console.log("finishing operation (returning "+retval+")");
				// finish the operation
				done(retval);
				// locks are released
			}, 1000);
		}, {'resource_a': 'read', 'resource_b': 'write'});

		prom.then(function (val) {
			// operation has been finished
			console.log("operation done, result was "+val);
			test_done.fail();
		}).catch(function (err) {
			console.log('mayday mayday, its all gone wrong: '+err);
			test_done();
		});

	});

});


describe('readme (sync example)', function() {

	it('works', function (test_done) {

		let resource_manager = new polylock();

		let prom = resource_manager.exec(function () {
			// locks have been granted
			console.log("starting operation");
			let retval = Math.floor(Math.random()*10);
			console.log("finishing operation (returning "+retval+")");
			return retval;
			// locks are released
		}, {'resource_a': 'read', 'resource_b': 'write'});

		prom.then(function (val) {
			// operation has been finished
			console.log("operation done, result was "+val);
			test_done();
		}).catch(function (err) {
			console.log('mayday mayday, its all gone wrong: '+err);
			test_done.fail();
		});

	});

});


describe('readme (all promises example)', function() {

	it('works', function (test_done) {

		let resource_manager = new polylock();

		resource_manager.wait(
				{'resource_a': 'read', 'resource_b': 'write'}
				).then(function(release) {
			// locks have been granted
			console.log("starting operation");
			return new Promise(function (timeout_fff) {
				setTimeout(function () {
					let retval = Math.floor(Math.random()*10);
					console.log("finishing operation (returning "+retval+")");
					// finish the operation
					timeout_fff(retval);
					release();
					// locks are released
				}, 1000);
			});
		}).then(function (val) {
			// operation has been finished
			console.log("operation done, result was "+val);
			test_done();
		}); 

	});

});


})();
