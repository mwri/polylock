class polylock {
    /**
     * Construct a 'polylock' resource manager.
     *
     * Optionally an object parameter may be passed with parameters.
     * The only key recognised is 'write_priority', which if set to true, causes
     * write locks to be prioritised over read locks.
     */

    constructor (params) {
        if (params === undefined)
            params = {};

        this._queue       = new ll();
        this._ex_locks    = {};
        this._ex_reserved = {};
        this._sh_locks    = {};
        this._op_num      = 1;

        this._drain_for_writes = params.write_priority ? true : false;
    }

    /**
     * Execute an operation when the locks required are available.
     *
     * The first parameter is the operation (a function), it is called with a
     * single parameter, which is a function the operation should call when it
     * is done, optionally passing a return value as a parameter to it. Locks
     * will be held by the operation until this 'done' function is called
     * so it should be called as soon as possible.
     */

    exec (op_fun, locks) {
        if (locks === undefined)
            locks = {};

        if (typeof op_fun !== 'function')
            return Promise.reject(new Error('operation not a function'));

        let queue  = this._queue;
        let op_num = this._op_num++;

        let this_polylock = this;

        return new Promise(function (op_fff, op_rej) {
            let op_data = {
                op_fun: op_fun,
                op_fff: op_fff,
                op_rej: op_rej,
                locks:  locks,
                op_num: op_num,
            };
            queue.push(op_data);
            let lock_status = this_polylock.test_locks(locks);
            if (lock_status === 0) {
                this_polylock.run_queue();
            } else if (this_polylock._drain_for_writes && (lock_status & 4) == 4) {
                this_polylock.reserve_locks(locks);
                op_data.op_res = true;
            }
        }).then(function (retval) {
            this_polylock.yield_locks(locks);
            this_polylock.run_queue();
            return retval;
        });
    }

    /**
     * Wait for the required locks. Returns a promise that will be resolved
     * when the locks are available.
     *
     * The promise resolves to a function which must be called to release
     * the locks granted.
     */

    wait (locks) {
        let this_polylock = this;

        return new Promise(function (caller_fff) {
            this_polylock.exec(function (op_fff, op_rej) {
                caller_fff(op_fff);
            }, locks);
        });
    }

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

    test_locks (req_locks) {
        let req_resources       = Object.keys(req_locks);
        let numof_req_resources = req_resources.length;

        if (numof_req_resources === 0)
            return 0;

        let sh_lock  = 0;
        let ex_lock  = 0;
        let reserved = 0;

        for (let i = 0; i < numof_req_resources; i++) {
            let req_resource = req_resources[i];
            if (req_resource in this._ex_locks && this._ex_locks[req_resource] > 0)
                ex_lock = 2;
            if (req_resource in this._ex_reserved && this._ex_reserved[req_resource] > 0)
                reserved = 1;
            if (req_resource in this._sh_locks && this._sh_locks[req_resource] > 0)
                if (req_locks[req_resource] === 'write')
                    sh_lock = 4;
        }

        return (reserved | ex_lock | sh_lock);
    }

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

    take_locks (req_locks) {
        if (this.test_locks(req_locks) > 1)
            return false;

        let req_resources       = Object.keys(req_locks);
        let numof_req_resources = req_resources.length;

        for (let i = 0; i < numof_req_resources; i++) {
            let req_resource = req_resources[i];
            if (req_locks[req_resource] === 'write')
                this._ex_locks[req_resource] = req_resource in this._ex_locks
                ? this._ex_locks[req_resource] + 1
                : 1;
            else
                this._sh_locks[req_resource] = req_resource in this._sh_locks
                ? this._sh_locks[req_resource] + 1
                : 1;
        }

        return true;
    }

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

    reserve_locks (req_locks) {
        let req_resources       = Object.keys(req_locks);
        let numof_req_resources = req_resources.length;

        for (let i = 0; i < numof_req_resources; i++) {
            let req_resource = req_resources[i];
            if (req_locks[req_resource] === 'write')
                this._ex_reserved[req_resource] = req_resource in this._ex_reserved
                ? this._ex_reserved[req_resource] + 1
                : 1;
        }
    }

    /**
     * Give up a reservation exclusive / write lock(s).
     *
     * This is the antithesis for reserve_locks, and should be called as soon
     * as possible after reserve_locks.
     */

    yield_reservations (red_reservations) {
        let red_resources       = Object.keys(red_reservations);
        let numof_red_resources = red_resources.length;

        for (let i = 0; i < numof_red_resources; i++) {
            let red_resource = red_resources[i];
            if (red_reservations[red_resource] === 'write')
                this._ex_reserved[red_resource]--;
        }
    }

    /**
     * Release lock(s).
     *
     * This is the antithesis for a successful take_locks call.
     */

    yield_locks (red_locks) {
        let red_resources       = Object.keys(red_locks);
        let numof_red_resources = red_resources.length;

        for (let i = 0; i < numof_red_resources; i++) {
            let red_resource = red_resources[i];
            if (red_locks[red_resource] === 'write')
                this._ex_locks[red_resource]--;
            else
                this._sh_locks[red_resource]--;
        }
    }

    run_queue () {
        for (let node = this._queue.head(); node !== undefined; node = node.next()) {
            let op_data = node.data();
            let lock_status = this.test_locks(op_data.locks);
            if (lock_status === 0 || (lock_status === 1 && op_data.op_res)) {
                if (op_data.op_res)
                    this.yield_reservations(op_data.locks);
                this.take_locks(op_data.locks);
                if (op_data.op_fun.length === 0) {
                    op_data.op_fff(op_data.op_fun());
                } else {
                    op_data.op_fun(op_data.op_fff, op_data.op_rej);
                }
                this._queue.remove(node);
            }
        }
    }
}

class ll {
    constructor () {
        this._head = undefined;
        this._tail = undefined;
    }

    head () {
        return this._head;
    }

    push (data) {
        let node = new lln(data,this._tail, undefined);

        if (this._tail === undefined) {
            this._head = this._tail = node;
        } else {
            this._tail.set_next(node);
            this._tail = node;
        }

        return node;
    }

    remove (node) {
        let prev = node._prev;
        let next = node._next;

        if (prev === undefined)
            this._head = next;
        else
            prev.set_next(next);

        if (next === undefined)
            this._tail = prev;
        else
            next.set_prev(prev);
    }
}


class lln {
    constructor (data, prev, next) {
        this._data = data;
        this._prev = prev;
        this._next = next;
    }

    data () {
        return this._data;
    }

    next () {
        return this._next;
    }

    set_next (new_next) {
        this._next = new_next;

        return this;
    }

    set_prev (new_prev) {
        this._prev = new_prev;

        return this;
    }
}


module.exports = polylock;
