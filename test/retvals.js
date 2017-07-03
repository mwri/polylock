(function () {


"use strict";


let polylock;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	polylock = require('./../dist/polylock.js');
	require('chai-jasmine');
} else {
	polylock = window.polylock;
}


describe('uncontended read', function() {

	let db = new polylock();

	it('operation 1 promise resolves to return value', function(done) {

		let retval = 4365;

		let op_prom = db.exec(function (fff) {
			fff(retval);
		}, {});

		op_prom.then(function (resolve_val) {
			expect(resolve_val).toBe(retval);
			done();
		}).catch(function (err) {
			done.fail(err);
		});

	});

	it('operation 2 promise resolves to return value', function(done) {

		let retval = 3654;

		let op_prom = db.exec(function (fff) {
			fff(retval);
		}, {resource: 'read'});

		op_prom.then(function (resolve_val) {
			expect(resolve_val).toBe(retval);
			done();
		}).catch(function (err) {
			done.fail(err);
		});

	});

});

describe('uncontended write', function() {

	let db = new polylock();

	it('operation 1 promise resolves to return value', function(done) {

		let retval = 4356;

		let op_prom = db.exec(function (fff) {
			fff(retval);
		}, {resource: 'write'});

		op_prom.then(function (resolve_val) {
			expect(resolve_val).toBe(retval);
			done();
		}).catch(function (err) {
			done.fail(err);
		});

	});

	it('operation 2 promise resolves to return value', function(done) {

		let retval = 5436;

		let op_prom = db.exec(function (fff) {
			fff(retval);
		}, {resource: 'write'});

		op_prom.then(function (resolve_val) {
			expect(resolve_val).toBe(retval);
			done();
		}).catch(function (err) {
			done.fail(err);
		});

	});

});


})();
