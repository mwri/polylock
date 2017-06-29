'use strict';

// Package: polylock v1.0.0
// Copyright: (C) 2017 Michael Wright <mjw@methodanalysis.com>
// License: MIT


(function () {

	var polylock = function () {

		/**
   * Construct a 'polylock' resource manager.
   *
   * Optionally an object parameter may be passed with parameters.
   * The only key recognised is 'write_priority', which if set to true, causes
   * write locks to be prioritised over read locks.
   */

		var polylock = function polylock() {
			var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};


			this.queue = new polylock_ll();
			this.ex_locks = {};
			this.ex_reserved = {};
			this.sh_locks = {};
			this.op_num = 1;

			this.drain_for_writes = params.write_priority ? true : false;
		};

		/**
   * Execute an operation when the locks required are available.
   *
   * The first parameter is the operation (a function), it is called with a
   * single parameter, which is a function the operation should call when it
   * is done, optionally passing a return value as a parameter to it. Locks
   * will be held by the operation until this 'done' function is called
   * so it should be called as soon as possible.
   */

		polylock.prototype.exec = function (op_fun) {
			var locks = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


			if (typeof op_fun !== 'function') return Promise.reject(new Error('operation not a function'));

			var queue = this.queue;
			var op_num = this.op_num++;

			var this_polylock = this;

			return new Promise(function (op_fff, op_rej) {
				var op_data = {
					op_fun: op_fun,
					op_fff: op_fff,
					op_rej: op_rej,
					locks: locks,
					op_num: op_num
				};
				queue.push(op_data);
				var lock_status = this_polylock.test_locks(locks);
				if (lock_status === 0) {
					this_polylock.run_queue();
				} else if (this_polylock.drain_for_writes && (lock_status & 4) == 4) {
					this_polylock.reserve_locks(locks);
					op_data.op_res = true;
				}
			}).then(function (retval) {
				this_polylock.yield_locks(locks);
				this_polylock.run_queue();
				return retval;
			});
		};

		/**
   * Return a code indicating the availability of a set of locks.
   *
   * Given the required locks (an object with keys for the name of each resource
   * required, and values of 'read' or 'write' for shared and exclusive locks
   * respectively), a bitmap is returned.
   * 
   * Bit 1 (LSB) means a reservation has been placed on resource for which a lock
   * has been requested (this means (if no other bits are set) that the lock IS
   * technically available, and a call to take_locks will succeed and have a normal
   * effect, but it is requested that voluntarily this not be done. This is used to
   * 'drain' read locks so that a write lock can get in.
   * 
   * Bit 2 means an exclusive lock is in force for one of the resources.
   * 
   * Bit 3 means a shared/read lock is in force for a resource for which an
   * exclusive/write lock has been requested.
   * 
   * This means the only return value which may be returned which indicates it is
   * ok to call take_locks, is zero, though it is not invalid (merely impolite and
   * potentially defeating of the resource management strategy) to also call
   * take_locks when the return value is one.
   * 
   * If the return value is 4 (bit 3 set) or any other value with bit 3 set (i.e.
   * the return valued bitwise AND 4 equals 4) it is potentially useful as well
   * as valid to call reserve_locks, which means the lock should be granted as
   * soon as possible, because it will not be possible to obtain read locks on
   * the resources requested for write in this request. NOTE that just as yield_locks
   * must be called following every take_locks, so that locks aren't held forever, so
   * yield_reservation must be called for every reserve_locks call. A reservation is
   * nearly as strong as an actual lock so everything could quickly grind to a halt
   * if this is not done.
   */

		polylock.prototype.test_locks = function (req_locks) {

			var req_resources = Object.keys(req_locks);
			var numof_req_resources = req_resources.length;

			if (numof_req_resources === 0) return 0;

			var sh_lock = 0;
			var ex_lock = 0;
			var reserved = 0;

			for (var i = 0; i < numof_req_resources; i++) {
				var req_resource = req_resources[i];
				if (req_resource in this.ex_locks && this.ex_locks[req_resource] > 0) ex_lock = 2;
				if (req_resource in this.ex_reserved && this.ex_reserved[req_resource] > 0) reserved = 1;
				if (req_resource in this.sh_locks && this.sh_locks[req_resource] > 0) if (req_locks[req_resource] === 'write') sh_lock = 4;
			}

			return reserved | ex_lock | sh_lock;
		};

		/**
   * Return true or false if the lock(s) were succesfully acquruired or not.
   *
   * Try to acquire (immediately / synchronously), the required locks. There is
   * no blocking alternative as such for this call, to wait for a lock, execute
   * an operation instead, which is in essence a callback for when lock(s) are
   * available (see exec).
   *
   * Note that this call will succeed against lock reservations! This is safe but
   * may be counter to resource management strategies.
   */

		polylock.prototype.take_locks = function (req_locks) {

			if (this.test_locks(req_locks) > 1) return false;

			var req_resources = Object.keys(req_locks);
			var numof_req_resources = req_resources.length;

			for (var i = 0; i < numof_req_resources; i++) {
				var req_resource = req_resources[i];
				if (req_locks[req_resource] === 'write') this.ex_locks[req_resource] = req_resource in this.ex_locks ? this.ex_locks[req_resource] + 1 : 1;else this.sh_locks[req_resource] = req_resource in this.sh_locks ? this.sh_locks[req_resource] + 1 : 1;
			}

			return true;
		};

		/**
   * Acquire a reservation for exclusive / write lock(s).
   *
   * Queue a reservation for exclusive / write locks. This always immediately
   * succeeds because it is a voluntary reservation which stops any new locks
   * being granted on a resource, but isn't a lock itself.
   *
   * As noted above, in test_locks, this really has just as much capacity to
   * grind all progress to a halt as a lock itself, because like a lock it
   * stops other locks being granted, but it always immiediately succeeds
   * because it isn't a lock grant! A call to release_reservation MUST be
   * made for every call to reserve_locks; although it isn't a lock grant it
   * should be treated as though it is an immediate exclusive lock in terms
   * of its effect on progress.
   *
   * It is perfectly acceptable for multiple reservations to be acquired.
   * Posessors of reservations then can call yield_reservations and
   * take_locks when it is appropriate to do so.
   */

		polylock.prototype.reserve_locks = function (req_locks) {

			var req_resources = Object.keys(req_locks);
			var numof_req_resources = req_resources.length;

			for (var i = 0; i < numof_req_resources; i++) {
				var req_resource = req_resources[i];
				if (req_locks[req_resource] === 'write') this.ex_reserved[req_resource] = req_resource in this.ex_reserved ? this.ex_reserved[req_resource] + 1 : 1;
			}
		};

		/**
   * Give up a reservation exclusive / write lock(s).
   *
   * This is the antithesis for reserve_locks, and should be called as soon
   * as possible after reserve_locks.
   */

		polylock.prototype.yield_reservations = function (red_reservations) {

			var red_resources = Object.keys(red_reservations);
			var numof_red_resources = red_resources.length;

			for (var i = 0; i < numof_red_resources; i++) {
				var red_resource = red_resources[i];
				if (red_reservations[red_resource] === 'write') this.ex_reserved[red_resource]--;
			}
		};

		/**
   * Release lock(s).
   *
   * This is the antithesis for a successful take_locks call.
   */

		polylock.prototype.yield_locks = function (red_locks) {

			var red_resources = Object.keys(red_locks);
			var numof_red_resources = red_resources.length;

			for (var i = 0; i < numof_red_resources; i++) {
				var red_resource = red_resources[i];
				if (red_locks[red_resource] === 'write') this.ex_locks[red_resource]--;else this.sh_locks[red_resource]--;
			}
		};

		polylock.prototype.run_queue = function () {

			for (var node = this.queue.head; node !== undefined; node = node.next) {
				var op_data = node.data;
				var lock_status = this.test_locks(op_data.locks);
				if (lock_status === 0 || lock_status === 1 && op_data.op_res) {
					if (op_data.op_res) this.yield_reservations(op_data.locks);
					this.take_locks(op_data.locks);
					op_data.op_fun(op_data.op_fff, op_data.op_rej);
					this.queue.remove(node);
				}
			}
		};

		var polylock_ll = function polylock_ll() {

			this.head = undefined;
			this.tail = undefined;
		};

		polylock_ll.prototype.push = function (data) {

			var node = {
				data: data,
				prev: this.tail,
				next: undefined
			};

			if (this.tail === undefined) {
				this.head = node;
				this.tail = node;
			} else {
				this.tail.next = node;
				this.tail = node;
			}

			return node;
		};

		polylock_ll.prototype.remove = function (node) {

			var prev = node.prev;
			var next = node.next;

			if (prev === undefined) this.head = next;else prev.next = next;

			if (next === undefined) this.tail = prev;else next.prev = prev;
		};

		return polylock;
	}();

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = {
			polylock: polylock
		};
	} else {
		window.polylock = polylock;
	}
})();
