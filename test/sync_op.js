(function () {


"use strict";


let polylock = require('./../lib/polylock.js');
let chai_jasmine = require('chai-jasmine');


describe('synchronous read operation (accepts no args)', function() {

	let db   = new polylock();
	let data = { num: 10 };

	it('returns result correctly', function() {

		let prom = db.exec(function () {
			return data.num;
		}, {resource: 'read'});

		return prom.then(function (result) {
			expect(result).toBe(10);
		});

	});

});


describe('synchronous write operation (accepts no args)', function() {

	it('returns result correctly', function() {

		let db   = new polylock();
		let data = { num: 10 };

		let prom = db.exec(function () {
			data.num++;
			return data.num;
		}, {resource: 'write'});

		return prom.then(function (result) {
			expect(result).toBe(11);
		});

	});

	it('runs (again) and returns result correctly', function() {

		let db   = new polylock();
		let data = { num: 10 };

		let prom = db.exec(function () {
			data.num++;
			return data.num;
		}, {resource: 'write'});

		return prom.then(function (result) {
			expect(result).toBe(11);
		}).then(function () {
			let prom = db.exec(function () {
				data.num++;
				return data.num;
			}, {resource: 'write'});

			return prom.then(function (result) {
				expect(result).toBe(12);
			});
		});

	});

});


})();
