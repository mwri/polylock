(function () {


"use strict";


let polylock;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	polylock = require('./../dist/polylock.js');
	require('chai-jasmine');
} else {
	polylock = window.polylock;
}


describe('synchronous read operation (accepts no args)', function() {

	let db   = new polylock();
	let data = { num: 10 };

	it('returns result correctly', function() {

		let prom = db.exec(function () {
			return data.num;
		}, {resource: 'read'});

		prom.then(function (result) {
			expect(result).toBe(10);
		});

	});

});


describe('synchronous write operation (accepts no args)', function() {

	let db   = new polylock();
	let data = { num: 10 };

	it('returns result correctly', function() {

		let prom = db.exec(function () {
			data.num++;
			return data.num;
		}, {resource: 'write'});

		prom.then(function (result) {
			expect(result).toBe(11);
		});

	});

	it('runs (again) and returns result correctly', function() {

		let prom = db.exec(function () {
			data.num++;
			return data.num;
		}, {resource: 'write'});

		prom.then(function (result) {
			expect(result).toBe(12);
		});

	});

});


})();
