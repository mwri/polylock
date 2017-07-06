# polylock [![Build Status](https://travis-ci.org/mwri/polylock.svg?branch=master)](https://travis-ci.org/mwri/polylock) [![Coverage Status](https://coveralls.io/repos/github/mwri/polylock/badge.svg?branch=master)](https://coveralls.io/github/mwri/polylock?branch=master)

Polylock is a resource locking library that allows asynchronous
code to be run as soon as locking conditions are met.

For each operation you want to run, call 'exec' on a polylock resource
manager, specifying a function to call when the locks are granted, and
a set of locks. The set of locks is an object where the keys are resource
names and the values are 'read' or 'write' (for shared or exclusive locking).

As with more or less any locking system, many concurrent read locks on a
resource may be granted at once, but a write lock excludes all other locks
(read and write).

## Example

For example, here notional resources **resource_a** and **resource_b** are
required (read and write respectively) to run an operation. A promise is
returned which is resolved (with the operations result) when the operation
completes.

Because an operation may be asynchronous it is passed a `done` function
which it calls to finish, optionally passing a result (here a timeout
is employed to contrive an asynchronous process of some sort).

The operation is passed a `fail` function too, which may optionally be
used to handle asynchronous failures.

```javascript
let polylock = require('polylock');

let resource_manager = new polylock();

let prom = resource_manager.exec(function (done, fail) {
    // locks have been granted
    console.log("starting operation");
    if (true === false) {
        // this is a (synchronous) bug in the operation
        throw new Error('tarantula');
    }
    setTimeout(function () {
        if (true === false) {
            // this is an asynchronous bug in the operation
            fail(new Error('hornet'));
        }
        let retval = Math.floor(Math.random()*10);
        console.log("finishing operation (returning "+retval+")");
        // finish the operation
        done(retval);
        // locks are released
    }, 1000);
}, {'resource_a': 'read', 'resource_b': 'write'});

prom.then(function (val) {
    // operation has been finished
    console.log("operation done, result was "+val);
}).catch(function (err) {
    console.log('mayday mayday, its all gone wrong: '+err);
});
```

Whilst this operation is in progress other operations that require a
**resource_a** read lock may run, but none that require a read or write
lock for **resource_b**.

If your operation is purely synchronous if can accept no arguments
and return the result instead, like this:

```javascript
let prom = resource_manager.exec(function () {
    // locks have been granted
    console.log("starting operation");
    let retval = Math.floor(Math.random()*10);
    console.log("finishing operation (returning "+retval+")");
    return retval;
    // locks are released
}, {'resource_a': 'read', 'resource_b': 'write'});
```

## Client side usage

The module works client side as well, the example above, without the
`let polylock = require('polylock');` will work in a web browser fine.

## ES5, ES6 and minification

The `dist` folder has the following files available:

File | Description
:-- | :--
polylock.js | Limited ES6 features (works with Node.js v4+ and most browsers)
polylock_es5.js | ES5 translation (should work with anything)
polylock_es5.min.js | Minified ES5 translation

## Resource contention

There is no limit to the number of resources that may be locked at
once, though more resources all contended may make lock grants more
difficult and operations that require a lot of locks on many different
resources may wait longer whilst they are kept out by many other less
greedy operations claiming locks in a continuous overlapping stream.

Write locks are especially vulnerable to being locked out since they
must wait for there to be no read locks on any of the resources they
are writing. For this reason there is a 'write priority' mode which
may be enabled like this:

```javascript
let resource_manager = new polylock({'write_priority': true});
```

When enabled, once a write lock on a resource has been requested no
more read locks will be granted on it, thus existing operations with
read locks will gradually complete and the write lock may then be
granted at the earliest possible time.

This will of course increase the average wait time for read locks
but in some cases this will only be a slight increase in return for
a (sometimes) huge improvement in write latency.

The unit tests create scenarios to test this; tests/compound.js runs
800 operations which randomly lock three resources read and write
for various times, here's a (currently) typical result:

```
INFO LOG: '800 ops read priority 58 max concurrent 9ms average read wait 324ms average write wait'
INFO LOG: '800 ops read priority 59 max concurrent 9ms average read wait 324ms average write wait'
INFO LOG: '800 ops write priority 37 max concurrent 10ms average read wait 48ms average write wait'
```

Here read operation wait times go from 9ms to 10ms but write
operation wait times are almost seven times smaller. The load is
random so results will vary each time but more or less inevitably
in this case read wait times will increase and write wait times
will decrease.

The 'max concurrent' figure is the maximum number of operations
running in parallel during the test, and sometimes write priority
results in higher peaks, sometimes lower.

## Build

run `npm install` to install the dev/build dependencies, and
`grunt build` to build.

This will create ES5 `dist/polylock.js` and `dist/polylock.min.js`
files, and run the unit tests against them.

Running `grunt watch` will invoke a continuous file watch build test
cycle and generate (ES6) coverage reports.
