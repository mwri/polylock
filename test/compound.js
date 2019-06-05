(function () {


"use strict";


let polylock = require('./../lib/polylock.js');
let chai_jasmine = require('chai-jasmine');


// set number of operations to execute over what period (ms)
let numof_ops     = 800;
let queue_window  = 1000;
let base_op_time  = 15;
let write_op_time = 25;
let read_chance   = 35;
let write_chance  = 5;

describe(numof_ops+' mixed compound (three resources) contended operations', function() {

	// make all the random decisions up front, and create a 'plan' so
	// the test is exactly repeatable,
	let plan = [];
	let a_write_count = 0;
	let b_write_count = 0;
	let c_write_count = 0;
	for (let i = 0; i < numof_ops; i++) {
		let locks = {};
		if (Math.floor(Math.random()*100) < read_chance + write_chance) {
			if (Math.floor(Math.random()*100) < write_chance) {
				locks.a = 'write';
				a_write_count++;
			} else {
				locks.a = 'read';
			}
		}
		if (Math.floor(Math.random()*100) < read_chance + write_chance) {
			if (Math.floor(Math.random()*100) < write_chance) {
				locks.b = 'write';
				b_write_count++;
			} else {
				locks.b = 'read';
			}
		}
		if (Math.floor(Math.random()*100) < read_chance + write_chance) {
			if (Math.floor(Math.random()*100) < write_chance) {
				locks.c = 'write';
				c_write_count++;
			} else {
				locks.c = 'read';
			}
		}
		let op_time = base_op_time;
		if (locks.a === 'write')
			op_time += write_op_time;
		if (locks.b === 'write')
			op_time += write_op_time;
		if (locks.c === 'write')
			op_time += write_op_time;
		let op_time_part1 = Math.floor(Math.random()*base_op_time);
		let op_time_part2 = Math.floor(Math.random()*base_op_time);
		plan.push({
			'after':   Math.floor(Math.random()*queue_window),
			'locks':   locks,
			'optime1': op_time_part1,
			'optime2': op_time_part2,
			});
	}

	it('data integrity is good with read priority', function(done) {

		run(false, done);

	}, 10000);

	it('data integrity is good with read priority again', function(done) {

		run(false, done);

	}, 10000);

	it('data integrity is good with write priority', function(done) {

		run(true, done);

	}, 10000);

	function run (write_priority, done) {

		let db = new polylock({write_priority:write_priority});

		let data  = { a: 10, b: 100, c: 1000 };
		let stats = { running: 0, max_con: 0 };

		let results = [];

		function mk_timed_op (op_plan) {
			setTimeout(function () {
				results.push(mk_op(op_plan));
			}, op_plan.after);
		}

		for (let i = 0; i < numof_ops; i++) {
			mk_timed_op(plan[i]);
		}

		setTimeout(function () {

			Promise.all(results).then(function (results2) {
				let a_unlocked_changes     = 0;
				let b_unlocked_changes     = 0;
				let c_unlocked_changes     = 0;
				let a_unlocked_non_changes = 0;
				let b_unlocked_non_changes = 0;
				let c_unlocked_non_changes = 0;
				let acc_read_wait_time     = 0;
				let acc_write_wait_time    = 0;
				let acc_reads_count        = 0;
				let acc_writes_count       = 0;
				for (let i = 0; i < results2.length; i++) {
					// check no writes under read locks, and an
					// increment under write locks
					if (results2[i].locks.a === 'read')
						expect(results2[i].end.a).toBe(results2[i].start.a);
					else if (results2[i].locks.a === 'write')
						expect(results2[i].end.a).toBe(results2[i].start.a+1);
					else if (results2[i].start.a === results2[i].end.a)
						a_unlocked_non_changes++;
					else
						a_unlocked_changes++;
					if (results2[i].locks.b === 'read')
						expect(results2[i].end.b).toBe(results2[i].start.b);
					else if (results2[i].locks.b === 'write')
						expect(results2[i].end.b).toBe(results2[i].start.b+1);
					else if (results2[i].start.b === results2[i].end.b)
						b_unlocked_non_changes++;
					else
						b_unlocked_changes++;
					if (results2[i].locks.c === 'read')
						expect(results2[i].end.c).toBe(results2[i].start.c);
					else if (results2[i].locks.c === 'write')
						expect(results2[i].end.c).toBe(results2[i].start.c+1);
					else if (results2[i].start.c === results2[i].end.c)
						c_unlocked_non_changes++;
					else
						c_unlocked_changes++;
					if (results2[i].locks.a === 'write'
							|| results2[i].locks.b === 'write'
							|| results2[i].locks.c === 'write'
							) {
						acc_writes_count++;
						acc_write_wait_time += results2[i].wait;
					} else {
						acc_reads_count++;
						acc_read_wait_time += results2[i].wait;
					}
				}
				// exclusively locked writes means predictable cumulative increments
				expect(data.a).toBe(10+a_write_count);
				expect(data.b).toBe(100+b_write_count);
				expect(data.c).toBe(1000+c_write_count);
				// changes to unlocked resources should occur
				expect(a_unlocked_changes).toBeGreaterThan(0);
				expect(b_unlocked_changes).toBeGreaterThan(0);
				expect(c_unlocked_changes).toBeGreaterThan(0);
				// changes to unlocked resources do not always occur
				expect(a_unlocked_non_changes).toBeGreaterThan(0);
				expect(b_unlocked_non_changes).toBeGreaterThan(0);
				expect(c_unlocked_non_changes).toBeGreaterThan(0);
				// report stats
				let avg_read_wait_time = Math.floor(acc_read_wait_time / acc_reads_count);
				let avg_write_wait_time = Math.floor(acc_write_wait_time / acc_writes_count);
				console.info(numof_ops+' ops '+(write_priority?'write':'read')+' priority '+stats.max_con+' max concurrent '+avg_read_wait_time+'ms average read wait '+avg_write_wait_time+'ms average write wait');
				done();
			}).catch(function (err) {
				if (err.stack !== undefined)
					console.log(err.stack);
				throw err;
			});
		}, Math.floor(queue_window*1.1));

		function mk_op (op_info) {

			let locks      = op_info.locks;
			let queue_time = new Date();

			return db.exec(
				function (fff) {
					let run_time = new Date();
					stats.running++;
					if (stats.running > stats.max_con)
						stats.max_con = stats.running;
					setTimeout(function () {
						let start = {
							a: data.a,
							b: data.b,
							c: data.c,
							};
						setTimeout(function () {
							if ('a' in locks && locks.a === 'write')
								data.a++;
							if ('b' in locks && locks.b === 'write')
								data.b++;
							if ('c' in locks && locks.c === 'write')
								data.c++;
							let end = {
								a: data.a,
								b: data.b,
								c: data.c,
								};
							fff({
								locks: locks,
								start: start,
								end:   end,
								wait:  run_time - queue_time,
								});
							stats.running--;
						}, op_info.optime2);
					}, op_info.optime1);
				},
				locks
				);

		}

	}

});


})();
