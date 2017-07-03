(function () {


"use strict";


let polylock;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	polylock = require('./../dist/polylock.js');
	require('chai-jasmine');
} else {
	polylock = window.polylock;
}


describe('200 contended mixed operations', function() {

	let db   = new polylock();
	let data = { num: 10 };

	it('read and write integrity is good', function(done) {

		function mk_timed_op () {
			setTimeout(function () {
				if (Math.floor(Math.random()*10) === 0) {
					results.push(write_op());
					write_count++;
				} else {
					results.push(read_op());
				}
			}, Math.floor(Math.random()*1000));
		}

		let results = [];
		let write_count = 0;
		for (let i = 0; i < 200; i++) {
			mk_timed_op();
		}

		setTimeout(function () {
			Promise.all(results).then(function (results2) {
				for (let i = 0; i < results2.length; i++) {
					if (results[i].op === 'read')
						expect(results2[i].num1).toBe(results2[i].num2);
				}
				expect(data.num).toBe(10+write_count);
				done();
			});
		}, 1100);

		function write_op () {

			return db.exec(
				function (fff) {
					setTimeout(function () {
						let num = data.num;
						setTimeout(function () {
							data.num = num+1;
							fff({op:'write',num1:num,num2:num+1});
						}, Math.floor(Math.random()*40));
					}, Math.floor(Math.random()*40));
				},
				{resource: 'write'}
				);

		}

		function read_op () {

			return db.exec(
				function (fff) {
					let num1 = data.num;
					setTimeout(function () {
						let num2 = data.num;
						fff({op:'read',num1:num1,num2:num2});
					}, Math.floor(Math.random()*40));
				},
				{resource: 'read'}
				);
		}

	});

});


})();
