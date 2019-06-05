(function () {


"use strict";


let polylock = require('./../lib/polylock.js');
let chai_jasmine = require('chai-jasmine');


describe('wait read', function() {

	let db = new polylock();

	it('operation 1 promise resolves to return value', function(done) {

		let retval = 4365;

		db.wait({resource: 'read'}).then(function (release) {
			release();
			return retval;
		}).then(function (resolve_val) {
			expect(resolve_val).toBe(retval);
			done();
		}).catch(function (err) {
			done.fail(err);
		});

	});

	it('operation 2 promise resolves to return value', function(done) {

		let retval = 3654;

		db.wait({resource: 'read'}).then(function (release) {
			release();
			return retval;
		}).then(function (resolve_val) {
			expect(resolve_val).toBe(retval);
			done();
		}).catch(function (err) {
			done.fail(err);
		});

	});

});

describe('wait write', function() {

	let db = new polylock();

	it('operation 1 promise resolves to return value', function(done) {

		let retval = 4356;

		db.wait({resource: 'write'}).then(function (release) {
			release();
			return retval;
		}).then(function (resolve_val) {
			expect(resolve_val).toBe(retval);
			done();
		}).catch(function (err) {
			done.fail(err);
		});

	});

	it('operation 2 promise resolves to return value', function(done) {

		let retval = 5436;

		db.wait({resource: 'write'}).then(function (release) {
			release();
			return retval;
		}).then(function (resolve_val) {
			expect(resolve_val).toBe(retval);
			done();
		}).catch(function (err) {
			done.fail(err);
		});

	});

});


})();
