(function () {


"use strict";


let polylock = require('./../lib/polylock.js');
let chai_jasmine = require('chai-jasmine');


describe('operations with read vs write priority (read draining for write)', function() {

	let plan = [];
	plan.push({ 'after': 10,  'rp_ord': 10,  'wp_ord': 10,  'locks': { a:'read'  }, 'rp_expd': 0, 'wp_expd': 0 });
	plan.push({ 'after': 20,  'rp_ord': 20,  'wp_ord': 20,  'locks': { a:'read'  }, 'rp_expd': 0, 'wp_expd': 0 });
	plan.push({ 'after': 30,  'rp_ord': 30,  'wp_ord': 30,  'locks': { a:'read'  }, 'rp_expd': 0, 'wp_expd': 0 });
	plan.push({ 'after': 40,  'rp_ord': 40,  'wp_ord': 40,  'locks': { a:'read'  }, 'rp_expd': 0, 'wp_expd': 0 });
	plan.push({ 'after': 50,  'rp_ord': 50,  'wp_ord': 50,  'locks': { a:'read'  }, 'rp_expd': 0, 'wp_expd': 0 });
	plan.push({ 'after': 55,  'rp_ord': 135, 'wp_ord': 60,  'locks': { a:'write' }, 'rp_expd': 0, 'wp_expd': 0 });
	plan.push({ 'after': 60,  'rp_ord': 70,  'wp_ord': 70,  'locks': { a:'read'  }, 'rp_expd': 0, 'wp_expd': 2 });
	plan.push({ 'after': 70,  'rp_ord': 80,  'wp_ord': 80,  'locks': { a:'read'  }, 'rp_expd': 0, 'wp_expd': 2 });
	plan.push({ 'after': 80,  'rp_ord': 90,  'wp_ord': 90,  'locks': { a:'read'  }, 'rp_expd': 0, 'wp_expd': 2 });
	plan.push({ 'after': 90,  'rp_ord': 100, 'wp_ord': 100, 'locks': { a:'read'  }, 'rp_expd': 0, 'wp_expd': 2 });
	plan.push({ 'after': 100, 'rp_ord': 110, 'wp_ord': 110, 'locks': { a:'read'  }, 'rp_expd': 0, 'wp_expd': 2 });
	plan.push({ 'after': 120, 'rp_ord': 120, 'wp_ord': 120, 'locks': { a:'read'  }, 'rp_expd': 0, 'wp_expd': 2 });
	plan.push({ 'after': 130, 'rp_ord': 130, 'wp_ord': 130, 'locks': { a:'read'  }, 'rp_expd': 0, 'wp_expd': 2 });
	plan.push({ 'after': 180, 'rp_ord': 140, 'wp_ord': 140, 'locks': { a:'read'  }, 'rp_expd': 2, 'wp_expd': 2 });
	plan.push({ 'after': 190, 'rp_ord': 150, 'wp_ord': 150, 'locks': { a:'read'  }, 'rp_expd': 2, 'wp_expd': 2 });
	plan.push({ 'after': 200, 'rp_ord': 160, 'wp_ord': 160, 'locks': { a:'read'  }, 'rp_expd': 2, 'wp_expd': 2 });

	it('write is delayed until reads are clear', function(done) {

		run(false, done);

	});

	it('write is scheduled after current reads finish', function(done) {

		run(true, done);

	});

	function run (write_priority, done) {

		let db   = new polylock({write_priority:write_priority});
		let data = 0;

		let result_proms = [];

		function mk_timed_op (op_plan) {
			setTimeout(function () {
				result_proms.push(mk_op(op_plan));
			}, op_plan.after);
		}

		for (let i = 0; i < plan.length; i++) {
			mk_timed_op(plan[i]);
		}

		setTimeout(function () {

			Promise.all(result_proms).then(function (results) {
				results.sort(function (a, b) { return a.run - b.run; });
				let last_ord = 0;
				for (let i = 0; i < results.length; i++) {
					let this_ord = write_priority
						? results[i].wp_ord
						: results[i].rp_ord;
					let this_sd_exp = write_priority
						? results[i].wp_expd
						: results[i].rp_expd;
					let this_fd_exp = results[i].locks.a === 'write'
						? this_sd_exp + 2
						: this_sd_exp;
					expect(this_ord).toBeGreaterThan(last_ord);
					expect(results[i].start_data).toBe(this_sd_exp);
					last_ord = this_ord;
				}
				done();
			}).catch(function (err) {
				if (err.stack !== undefined)
					console.log(err.stack);
				throw err;
			});
		}, 300);

		function mk_op (op_info) {

			let queue_time = new Date();

			return db.exec(
				function (fff) {
					let run_time = new Date();
					let op_time    = 40;
					let start_data = data;
					if (op_info.locks.a === 'write')
						data++;
					setTimeout(function () {
						if (op_info.locks.a === 'write')
							data++;
						let end_time = new Date();
						let end_data = data;
						fff({
							locks:      op_info.locks,
							queued:     queue_time,
							run:        run_time,
							end:        end_time,
							wait:       run_time - queue_time,
							rp_ord:     op_info.rp_ord,
							wp_ord:     op_info.wp_ord,
							start_data: start_data,
							end_data:   end_data,
							rp_expd:    op_info.rp_expd,
							wp_expd:    op_info.wp_expd,
							});
					}, op_time);
				},
				op_info.locks
				);

		}

	}

});


})();
