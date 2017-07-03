(function () {


"use strict";


let polylock;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	polylock = require('./../dist/polylock.js');
	require('chai-jasmine');
} else {
	polylock = window.polylock;
}


describe('100 contended read operations', function() {

	let db   = new polylock();
	let data = { num: 10 };

	it('read is successful', function(done) {

		function mk_timed_op () {
			results.push(
				db.exec(function (fff) {
					setTimeout(function () {
						fff(data.num);
					}, Math.floor(Math.random()*20));
				}, {resource: 'read'})
				);
		}

		let results = [];
		for (let i = 0; i < 100; i++) {
			mk_timed_op();
		}

		Promise.all(results).then(function (resolved_results) {
			for (let i = 0; i < 100; i++) {
				expect(resolved_results[i]).toBe(10);
			}
			done();
		}).catch(function (err) {
			done.fail(err);
		});

	});

	it('data writing integrity is good', function(done) {

		function mk_timed_op () {
			results.push(db.exec(
				function (fff) {
					setTimeout(function () {
						let num = data.num;
						setTimeout(function () {
							data.num = num+1;
							fff(num+1);
						}, Math.floor(Math.random()*20));
					}, Math.floor(Math.random()*20));
				},
				{resource: 'write'}
				));
		}

		let results = [];
		for (let i = 0; i < 100; i++) {
			mk_timed_op();
		}

		Promise.all(results).then(function (results2) {
			results2.sort(function (a, b) { return a - b; });
			for (let i = 0; i < results2.length; i++) {
				expect(results2[i]).toBe(i+11);
			}
			done();
		});

	});

});


})();
