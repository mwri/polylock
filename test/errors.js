(function () {


"use strict";


let polylock;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	polylock = require('./../dist/polylock.js');
	require('chai-jasmine');
} else {
	polylock = window.polylock;
}


let db = new polylock();

describe('non function operation', function() {

	it('results in a rejected promise', function(done) {

		let op_prom = db.exec(5, {});

		op_prom.then(function () {
			done.fail('promise resolved; expected rejection');
		}).catch(function () {
			done();
		});

	});

});

describe('operation throwing error object', function() {

	it('results in promise rejection', function(done) {

		let err = new Error('here be dragons');

		let op_prom = db.exec(function (fff) {
			throw err;
		}, {});

		op_prom.then(function () {
			done.fail('promise resolved; expected rejection');
		}).catch(function () {
			done();
		});

	});

});

describe('operation calling the rejection callback with an error object', function() {

	it('results in promise rejection', function(done) {

		let err = new Error('here be dragons');

		let op_prom = db.exec(function (fff, rej) {
			rej(err);
		});

		op_prom.then(function () {
			done.fail('promise resolved; expected rejection');
		}).catch(function () {
			done();
		});

	});

});

describe('operation throwing error string', function() {

	it('results in promise rejection', function(done) {

		let err = 'here be dragons';

		let op_prom = db.exec(function (fff) {
			throw err;
		}, {});

		op_prom.then(function () {
			done.fail('promise resolved; expected rejection');
		}).catch(function () {
			done();
		});

	});

});

describe('operation calling the rejection callback with an error object', function() {

	it('results in promise rejection', function(done) {

		let err = 'here be dragons';

		let op_prom = db.exec(function (fff, rej) {
			rej(err);
		}, {});

		op_prom.then(function () {
			done.fail('promise resolved; expected rejection');
		}).catch(function () {
			done();
		});

	});

});

describe('operation crashing', function() {

	it('results in promise rejection', function(done) {

		let op_prom = db.exec(function (fff, rej) {
			fff(10/0);
		}, {});

		op_prom.then(function () {
			done.fail('promise resolved; expected rejection');
		}).catch(function () {
			done();
		});

	});

});


})();
