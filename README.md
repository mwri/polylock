# polylock [![Build Status](https://travis-ci.org/mwri/polylock.svg?branch=master)](https://travis-ci.org/mwri/polylock) [![Coverage Status](https://coveralls.io/repos/github/mwri/polylock/badge.svg?branch=master)](https://coveralls.io/github/mwri/polylock?branch=master)

Resource locking is not often a subject with Javascript/NodeJS, because
it is largely a single process asynchronous world. However async operations
can give rise to the same problems as threads, because all objects within
the scope of two or more async functions represent, in effect, shared data.

Polylock is a resource locking library that allows operations to block/wait
until the requested locks are granted, allowing
[critical sections](https://en.wikipedia.org/wiki/Critical_section) to be
made safe.

## Contents

1. [Promises example](#promises-example).
2. [Async/await example](#async-await-example).
3. [Callback example](#callback-example).
4. [Resource contention](#resource-contention).

## Promises example

A 'resource' is just a name, and can be read locked (shared), or write
locked (exclusive).

The basic formula for running a critical section to run, after locks are
granted is as follows:

```javascript
const polylock = require('polylock');
let resource_manager = new polylock();

resource_manager
    .wait(locks)
    .then((release) => {
        // critical section here
        release();
    });
```

Here `locks` is an object where the keys are resource names and the
values are `read` or `write`. So `{'foo': 'read', 'bar': 'write'}`
would mean that a read lock on "foo" and a write lock on "bar"
must be granted, and `wait` returns a promise which resolves when
the locks are granted. It's then certified that nothing will change
"foo" and nothing will even look at "bar" in the critical section
until `release()` is called, which releases the locks.

A simple illustration of this is [promises_hello.js](./examples/promises_hello.js)
where three async operations are created (A, B and C) each artificially made to
take 2 seconds by way of `setTimeout`. Each async operation requires a write lock
on "resource_a" so they each have to take it in turns to run:

```javascript
const polylock = require('polylock');
let resource_manager = new polylock();
let start_ms = (new Date()).getTime();

console.log(`${new Date()}  waiting A`);
resource_manager
    .wait({'resource_a': 'write'})
    .then((release) => {
        console.log(`${new Date()}  begin A`);
        return new Promise((resolve) => {
            setTimeout(resolve, 2000);
        }).then(() => {
            console.log(`${new Date()}  end A`);
            release();
        });
    });

console.log(`${new Date()}  waiting B`);
resource_manager
    .wait({'resource_a': 'write'})
    .then((release) => {
        console.log(`${new Date()}  begin B`);
        return new Promise((resolve) => {
            setTimeout(resolve, 2000);
        }).then(() => {
            console.log(`${new Date()}  end B`);
            release();
        });
    });

console.log(`${new Date()}  waiting C`);
resource_manager
    .wait({'resource_a': 'write'})
    .then((release) => {
        console.log(`${new Date()}  begin C`);
        return new Promise((resolve) => {
            setTimeout(resolve, 2000);
        }).then(() => {
            console.log(`${new Date()}  end C`);
            release();
        });
    });
```

The result is something like (each operation can only begin when
another one releases its locks):

```text
Sat Aug 03 2019 13:40:30 GMT+0100 (BST)  waiting A
Sat Aug 03 2019 13:40:30 GMT+0100 (BST)  waiting B
Sat Aug 03 2019 13:40:30 GMT+0100 (BST)  waiting C
Sat Aug 03 2019 13:40:30 GMT+0100 (BST)  begin A
Sat Aug 03 2019 13:40:32 GMT+0100 (BST)  end A
Sat Aug 03 2019 13:40:32 GMT+0100 (BST)  begin B
Sat Aug 03 2019 13:40:34 GMT+0100 (BST)  end B
Sat Aug 03 2019 13:40:34 GMT+0100 (BST)  begin C
Sat Aug 03 2019 13:40:36 GMT+0100 (BST)  end C
```

A more extensive example with read and write locks on different
resources is [promises_more.js](./examples/promises_more.js).
The `critical_section` function is again a time delay time delay
using `setTimeout`, this time random 1-2 seconds. The `contended`
function waits for the required locks and then calls `critical_section`.
A `ts` function returns the number of milliseconds since the start, so
we can see more clearly what's going on. Finally, a set of results for
six contended operations, with various different locks required for
each, is accumulated, and when they are all complete the results are
displayed:

```javascript
const polylock = require('polylock');
let resource_manager = new polylock();
let start_ms = (new Date()).getTime();

let results = Promise.all([
    contended({'resource_a': 'read',  'resource_b': 'write'}, 'A_read_B_write_1'),
    contended({'resource_a': 'read',  'resource_b': 'write'}, 'A_read_B_write_2'),
    contended({'resource_a': 'read',  'resource_b': 'write'}, 'A_read_B_write_3'),
    contended({'resource_a': 'read',  'resource_c': 'write'}, 'A_read_C_write_4'),
    contended({'resource_a': 'read',  'resource_d': 'write'}, 'A_read_D_write_5'),
    contended({'resource_a': 'write', 'resource_e': 'read' }, 'A_write_E_read_6'),
]).then((results) => {
    console.log(results);
});

function contended (locks, descr) {
    console.log(`${ts()}\tWAIT\t${descr}\twaiting for locks`);
    return resource_manager
        .wait(locks)
        .then((release) => {
            console.log(`${ts()}\tGRANT\t${descr}\tlocks granted, starting critical section`);
            return critical_section(descr)
                .then((retval) => {
                    console.log(`${ts()}\tRELEASE\t${descr}\tlocks granted, starting critical section`);
                    release();
                    return retval;
                });
        });
}

function critical_section (descr) {
    console.log(`${ts()}\tBEGIN\t${descr}\tstarting async operation`);
    return new Promise((resolve) => {
        setTimeout(
            function () {
                resolve(Math.floor(Math.random() * 100)),
                console.log(`${ts()}\tCOMMIT\t${descr}\tfinished async operation`);
            },
            1000 + Math.floor(Math.random() * 1000)
        );
    }).then((retval) => {
        return {
            'operation': descr,
            'result':    retval,
        };
    });
}

function ts () {
    return `${(new Date()).getTime() - start_ms}ms`;
}
```

If you run this, the result is as follows (timings will vary of course):

```text
0ms     WAIT    A_read_B_write_1        waiting for locks
2ms     WAIT    A_read_B_write_2        waiting for locks
2ms     WAIT    A_read_B_write_3        waiting for locks
2ms     WAIT    A_read_C_write_4        waiting for locks
2ms     WAIT    A_read_D_write_5        waiting for locks
2ms     WAIT    A_write_E_read_6        waiting for locks
3ms     GRANT   A_read_B_write_1        locks granted, starting critical section
3ms     BEGIN   A_read_B_write_1        starting async operation
3ms     GRANT   A_read_C_write_4        locks granted, starting critical section
3ms     BEGIN   A_read_C_write_4        starting async operation
3ms     GRANT   A_read_D_write_5        locks granted, starting critical section
3ms     BEGIN   A_read_D_write_5        starting async operation
1417ms  COMMIT  A_read_C_write_4        finished async operation
1417ms  RELEASE A_read_C_write_4        critical section done, releasing locks
1691ms  COMMIT  A_read_B_write_1        finished async operation
1691ms  RELEASE A_read_B_write_1        critical section done, releasing locks
1691ms  GRANT   A_read_B_write_2        locks granted, starting critical section
1691ms  BEGIN   A_read_B_write_2        starting async operation
1970ms  COMMIT  A_read_D_write_5        finished async operation
1970ms  RELEASE A_read_D_write_5        critical section done, releasing locks
3352ms  COMMIT  A_read_B_write_2        finished async operation
3352ms  RELEASE A_read_B_write_2        critical section done, releasing locks
3353ms  GRANT   A_read_B_write_3        locks granted, starting critical section
3353ms  BEGIN   A_read_B_write_3        starting async operation
4959ms  COMMIT  A_read_B_write_3        finished async operation
4959ms  RELEASE A_read_B_write_3        critical section done, releasing locks
4959ms  GRANT   A_write_E_read_6        locks granted, starting critical section
4959ms  BEGIN   A_write_E_read_6        starting async operation
6306ms  COMMIT  A_write_E_read_6        finished async operation
6306ms  RELEASE A_write_E_read_6        critical section done, releasing locks
[ { operation: 'A_read_B_write_1', result: 73 },
  { operation: 'A_read_B_write_2', result: 54 },
  { operation: 'A_read_B_write_3', result: 7 },
  { operation: 'A_read_C_write_4', result: 49 },
  { operation: 'A_read_D_write_5', result: 58 },
  { operation: 'A_write_E_read_6', result: 31 } ]
```

This clearly demonstrates the lock contention; all six operations immediately
begin waiting for locks, and operations *A_read_B_write_1*, *A_read_C_write_4*
and *A_read_D_write_5* immediately get their locks granted.

Operation *A_read_B_write_1* gets a grant simply because it was first, and
that means *A_read_B_write_2* and *A_read_B_write_3* can't be granted locks
because they both want a *write lock* on *resource_b*, which is why
*A_read_C_write_4* and *A_read_D_write_5* are next, since the only lock
in common with *A_read_B_write_1* is a *read lock* on *resource_a* and
read locks aren't exclusive.

In this example *A_read_C_write_4* finishes next, which allows no other
operation to have locks granted. Then *A_read_B_write_1* finishes, which
was holding the *write lock* on *resource_b*, so *A_read_B_write_2* is
immediately granted locks when this happens.

Next *A_read_D_write_5* finishes, then *A_read_B_write_2*, which allows
*A_read_B_write_3* to proceed (which was blocked waiting for a *write
lock* on *resource_b*).

Finally when *A_read_B_write_3* finishes *A_write_E_read_6* can get a
look in, after being blocked the whole time waiting for a *write lock*
on *resource_a* which has been tied up by every other operation getting
read locks on it.

This example is run in the unit tests, but with shorter timeouts (100ms
to 200ms instead of 1s to 2s).

## Async/await example

A 'resource' is just a name, and can be read locked (shared), or write
locked (exclusive).

The basic formula for running a critical section to run, after locks are
granted is as follows:

```javascript
const polylock = require('polylock');
let resource_manager = new polylock();

let release = resource_manager.wait(locks);
// critical section here
release();
```

Here `locks` is an object where the keys are resource names and the
values are `read` or `write`. So `{'foo': 'read', 'bar': 'write'}`
would mean that a read lock on "foo" and a write lock on "bar"
must be granted, and `wait` returns a promise which resolves when
the locks are granted. It's then certified that nothing will change
"foo" and nothing will even look at "bar" in the critical section
until `release()` is called, which releases the locks.

A simple illustration of this is [asyncawait_hello.js](./examples/asyncawait_hello.js)
where three async operations are created (A, B and C) each artificially made to
take 2 seconds by way of `setTimeout`. Each async operation requires a write lock
on "resource_a" so they each have to take it in turns to run:

```javascript
const polylock = require('polylock');
let resource_manager = new polylock();
let start_ms = (new Date()).getTime();

async function contend (op) {
    console.log(`${new Date()}  waiting ${op}`);
    let release = await resource_manager.wait({'resource_a': 'write'});
    console.log(`${new Date()}  begin A`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(`${new Date()}  end A`);
    release();
}

contend('A');
contend('B');
contend('C');
```

The result is something like (each operation can only begin when
another one releases its locks):

```text
Sat Aug 03 2019 13:57:13 GMT+0100 (BST)  waiting A
Sat Aug 03 2019 13:57:13 GMT+0100 (BST)  waiting B
Sat Aug 03 2019 13:57:13 GMT+0100 (BST)  waiting C
Sat Aug 03 2019 13:57:13 GMT+0100 (BST)  begin A
Sat Aug 03 2019 13:57:15 GMT+0100 (BST)  end A
Sat Aug 03 2019 13:57:15 GMT+0100 (BST)  begin A
Sat Aug 03 2019 13:57:17 GMT+0100 (BST)  end A
Sat Aug 03 2019 13:57:17 GMT+0100 (BST)  begin A
Sat Aug 03 2019 13:57:19 GMT+0100 (BST)  end A
```

A more extensive example with read and write locks on different
resources is [asyncawait_more.js](./examples/asyncawait_more.js).
The `critical_section` function is again a time delay time delay
using `setTimeout`, this time random 1-2 seconds. The `contended`
function waits for the required locks and then calls `critical_section`.
A `ts` function returns the number of milliseconds since the start, so
we can see more clearly what's going on. Finally, a set of results for
six contended operations, with various different locks required for
each, is accumulated, and when they are all complete the results are
displayed:

```javascript
const polylock = require('polylock');
let resource_manager = new polylock();
let start_ms = (new Date()).getTime();

let results = Promise.all([
    contended({'resource_a': 'read',  'resource_b': 'write'}, 'A_read_B_write_1'),
    contended({'resource_a': 'read',  'resource_b': 'write'}, 'A_read_B_write_2'),
    contended({'resource_a': 'read',  'resource_b': 'write'}, 'A_read_B_write_3'),
    contended({'resource_a': 'read',  'resource_c': 'write'}, 'A_read_C_write_4'),
    contended({'resource_a': 'read',  'resource_d': 'write'}, 'A_read_D_write_5'),
    contended({'resource_a': 'write', 'resource_e': 'read' }, 'A_write_E_read_6'),
]).then((results) => {
    console.log(results);
});

async function contended (locks, descr) {
    console.log(`${ts()}\tWAIT\t${descr}\twaiting for locks`);
    let release = await resource_manager.wait(locks);
    console.log(`${ts()}\tGRANT\t${descr}\tlocks granted, starting critical section`);
    let result = await critical_section(descr);
    console.log(`${ts()}\tRELEASE\t${descr}\tlocks granted, starting critical section`);
    release();
    return result;
}

async function critical_section (descr) {
    console.log(`${ts()}\tBEGIN\t${descr}\tstarting async operation`);
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.floor(Math.random() * 1000)));
    console.log(`${ts()}\tCOMMIT\t${descr}\tfinished async operation`);
    return {
        'operation': descr,
        'result':    Math.floor(Math.random() * 100),
    };
}

function ts () {
    return `${(new Date()).getTime() - start_ms}ms`;
}
```

If you run this, the result is as follows (timings will vary of course):

```text
0ms     WAIT    A_read_B_write_1        waiting for locks
2ms     WAIT    A_read_B_write_2        waiting for locks
2ms     WAIT    A_read_B_write_3        waiting for locks
2ms     WAIT    A_read_C_write_4        waiting for locks
2ms     WAIT    A_read_D_write_5        waiting for locks
2ms     WAIT    A_write_E_read_6        waiting for locks
3ms     GRANT   A_read_B_write_1        locks granted, starting critical section
3ms     BEGIN   A_read_B_write_1        starting async operation
3ms     GRANT   A_read_C_write_4        locks granted, starting critical section
3ms     BEGIN   A_read_C_write_4        starting async operation
3ms     GRANT   A_read_D_write_5        locks granted, starting critical section
3ms     BEGIN   A_read_D_write_5        starting async operation
1417ms  COMMIT  A_read_C_write_4        finished async operation
1417ms  RELEASE A_read_C_write_4        critical section done, releasing locks
1691ms  COMMIT  A_read_B_write_1        finished async operation
1691ms  RELEASE A_read_B_write_1        critical section done, releasing locks
1691ms  GRANT   A_read_B_write_2        locks granted, starting critical section
1691ms  BEGIN   A_read_B_write_2        starting async operation
1970ms  COMMIT  A_read_D_write_5        finished async operation
1970ms  RELEASE A_read_D_write_5        critical section done, releasing locks
3352ms  COMMIT  A_read_B_write_2        finished async operation
3352ms  RELEASE A_read_B_write_2        critical section done, releasing locks
3353ms  GRANT   A_read_B_write_3        locks granted, starting critical section
3353ms  BEGIN   A_read_B_write_3        starting async operation
4959ms  COMMIT  A_read_B_write_3        finished async operation
4959ms  RELEASE A_read_B_write_3        critical section done, releasing locks
4959ms  GRANT   A_write_E_read_6        locks granted, starting critical section
4959ms  BEGIN   A_write_E_read_6        starting async operation
6306ms  COMMIT  A_write_E_read_6        finished async operation
6306ms  RELEASE A_write_E_read_6        critical section done, releasing locks
[ { operation: 'A_read_B_write_1', result: 73 },
  { operation: 'A_read_B_write_2', result: 54 },
  { operation: 'A_read_B_write_3', result: 7 },
  { operation: 'A_read_C_write_4', result: 49 },
  { operation: 'A_read_D_write_5', result: 58 },
  { operation: 'A_write_E_read_6', result: 31 } ]
```

This clearly demonstrates the lock contention; all six operations immediately
begin waiting for locks, and operations *A_read_B_write_1*, *A_read_C_write_4*
and *A_read_D_write_5* immediately get their locks granted.

Operation *A_read_B_write_1* gets a grant simply because it was first, and
that means *A_read_B_write_2* and *A_read_B_write_3* can't be granted locks
because they both want a *write lock* on *resource_b*, which is why
*A_read_C_write_4* and *A_read_D_write_5* are next, since the only lock
in common with *A_read_B_write_1* is a *read lock* on *resource_a* and
read locks aren't exclusive.

In this example *A_read_C_write_4* finishes next, which allows no other
operation to have locks granted. Then *A_read_B_write_1* finishes, which
was holding the *write lock* on *resource_b*, so *A_read_B_write_2* is
immediately granted locks when this happens.

Next *A_read_D_write_5* finishes, then *A_read_B_write_2*, which allows
*A_read_B_write_3* to proceed (which was blocked waiting for a *write
lock* on *resource_b*).

Finally when *A_read_B_write_3* finishes *A_write_E_read_6* can get a
look in, after being blocked the whole time waiting for a *write lock*
on *resource_a* which has been tied up by every other operation getting
read locks on it.

This example is run in the unit tests, but with shorter timeouts (100ms
to 200ms instead of 1s to 2s).

## Callback example

A 'resource' is just a name, and can be read locked (shared), or write
locked (exclusive).

The basic formula for running a critical section to run, after locks are
granted is as follows:

```javascript
const polylock = require('polylock');
let resource_manager = new polylock();

let release = resource_manager.exec(callback, locks);

function callback () {
    // critical section in this function
}
```

Here `locks` is an object where the keys are resource names and the
values are `read` or `write`. So `{'foo': 'read', 'bar': 'write'}`
would mean that a read lock on "foo" and a write lock on "bar"
must be granted, and `callback` is a function which is called when
the locks are granted. It's then certified that nothing will change
"foo" and nothing will even look at "bar" until `callback` returns.
Unlike the promises based formats, no release function is required
because the locks are released when the `callback` function returns.

A simple illustration of this is [callback_hello.js](./examples/callback_hello.js)
where three async operations are created (A, B and C) each artificially made to
take 2 seconds by way of `setTimeout`. Each async operation requires a write lock
on "resource_a" so they each have to take it in turns to run:


```javascript
const polylock = require('polylock');
let resource_manager = new polylock();
let start_ms = (new Date()).getTime();

console.log(`${new Date()}  waiting A`);
resource_manager.exec(
    function (done, fail) {
        console.log(`${new Date()}  begin A`);
        setTimeout(function () {
            console.log(`${new Date()}  end A`);
            done();
        }, 2000);
    },
    {'resource_a': 'write'}
);

console.log(`${new Date()}  waiting B`);
resource_manager.exec(
    function (done, fail) {
        console.log(`${new Date()}  begin B`);
        setTimeout(function () {
            console.log(`${new Date()}  end B`);
            done();
        }, 2000);
    },
    {'resource_a': 'write'}
);

console.log(`${new Date()}  waiting C`);
resource_manager.exec(
    function (done, fail) {
        console.log(`${new Date()}  begin C`);
        setTimeout(function () {
            console.log(`${new Date()}  end C`);
            done();
        }, 2000);
    },
    {'resource_a': 'write'}
);
```

The result is something like (each operation can only begin when
another one releases its locks):

```text
Sat Aug 03 2019 14:14:03 GMT+0100 (BST)  waiting A
Sat Aug 03 2019 14:14:03 GMT+0100 (BST)  begin A
Sat Aug 03 2019 14:14:03 GMT+0100 (BST)  waiting B
Sat Aug 03 2019 14:14:03 GMT+0100 (BST)  waiting C
Sat Aug 03 2019 14:14:05 GMT+0100 (BST)  end A
Sat Aug 03 2019 14:14:05 GMT+0100 (BST)  begin B
Sat Aug 03 2019 14:14:07 GMT+0100 (BST)  end B
Sat Aug 03 2019 14:14:07 GMT+0100 (BST)  begin C
Sat Aug 03 2019 14:14:09 GMT+0100 (BST)  end C
```

A more extensive example with read and write locks on different
resources is [asyncawait_more.js](./examples/asyncawait_more.js).
The `critical_section` function is again a time delay time delay
using `setTimeout`, this time random 1-2 seconds. The `contended`
function waits for the required locks and then calls `critical_section`.
A `ts` function returns the number of milliseconds since the start, so
we can see more clearly what's going on. Finally, a set of results for
six contended operations, with various different locks required for
each, is accumulated, and when they are all complete the results are
displayed:

```javascript
const polylock = require('polylock');
let resource_manager = new polylock();
let start_ms = (new Date()).getTime();

contended({'resource_a': 'read',  'resource_b': 'write'}, 'A_read_B_write_1');
contended({'resource_a': 'read',  'resource_b': 'write'}, 'A_read_B_write_2');
contended({'resource_a': 'read',  'resource_b': 'write'}, 'A_read_B_write_3');
contended({'resource_a': 'read',  'resource_c': 'write'}, 'A_read_C_write_4');
contended({'resource_a': 'read',  'resource_d': 'write'}, 'A_read_D_write_5');
contended({'resource_a': 'write', 'resource_e': 'read' }, 'A_write_E_read_6');

function contended (locks, descr) {
    console.log(`${ts()}\tWAIT\t${descr}\twaiting for locks`);
    return resource_manager.exec(critical_section.bind(undefined, descr), locks);
}

function critical_section (descr, done, fail) {
    console.log(`${ts()}\tGRANT\t${descr}\tlocks granted, starting critical section`);
    console.log(`${ts()}\tBEGIN\t${descr}\tstarting async operation`);
    setTimeout(
        function () {
            console.log(`${ts()}\tCOMMIT\t${descr}\tfinished async operation`);
            console.log({
                'operation': descr,
                'result':    Math.floor(Math.random() * 100),
            });
            done();
            console.log(`${ts()}\tRELEASE\t${descr}\treturning, locks will be released`);
        },
        1000 + Math.floor(Math.random() * 1000)
    );
}

function ts () {
    return `${(new Date()).getTime() - start_ms}ms`;
}
```

Unlike the promise versions, the result set is not accumulated
because there is no return chain as such, though, if you want you
can employ a hybrid to get a return value, because `exec` actually
does return a promise which is resolved to the value that that
`callback` passes to `done`.

Running this, the result is as follows (timings will vary of course):

```text
0ms     WAIT    A_read_B_write_1        waiting for locks
2ms     GRANT   A_read_B_write_1        locks granted, starting critical section
2ms     BEGIN   A_read_B_write_1        starting async operation
2ms     WAIT    A_read_B_write_2        waiting for locks
2ms     WAIT    A_read_B_write_3        waiting for locks
3ms     WAIT    A_read_C_write_4        waiting for locks
3ms     GRANT   A_read_C_write_4        locks granted, starting critical section
3ms     BEGIN   A_read_C_write_4        starting async operation
3ms     WAIT    A_read_D_write_5        waiting for locks
3ms     GRANT   A_read_D_write_5        locks granted, starting critical section
3ms     BEGIN   A_read_D_write_5        starting async operation
3ms     WAIT    A_write_E_read_6        waiting for locks
1501ms  COMMIT  A_read_C_write_4        finished async operation
{ operation: 'A_read_C_write_4', result: 64 }
1504ms  RELEASE A_read_C_write_4        returning, locks will be released
1625ms  COMMIT  A_read_B_write_1        finished async operation
{ operation: 'A_read_B_write_1', result: 79 }
1625ms  RELEASE A_read_B_write_1        returning, locks will be released
1625ms  GRANT   A_read_B_write_2        locks granted, starting critical section
1625ms  BEGIN   A_read_B_write_2        starting async operation
1839ms  COMMIT  A_read_D_write_5        finished async operation
{ operation: 'A_read_D_write_5', result: 23 }
1840ms  RELEASE A_read_D_write_5        returning, locks will be released
3626ms  COMMIT  A_read_B_write_2        finished async operation
{ operation: 'A_read_B_write_2', result: 34 }
3626ms  RELEASE A_read_B_write_2        returning, locks will be released
3626ms  GRANT   A_read_B_write_3        locks granted, starting critical section
3626ms  BEGIN   A_read_B_write_3        starting async operation
4843ms  COMMIT  A_read_B_write_3        finished async operation
{ operation: 'A_read_B_write_3', result: 84 }
4843ms  RELEASE A_read_B_write_3        returning, locks will be released
4844ms  GRANT   A_write_E_read_6        locks granted, starting critical section
4844ms  BEGIN   A_write_E_read_6        starting async operation
6109ms  COMMIT  A_write_E_read_6        finished async operation
{ operation: 'A_write_E_read_6', result: 85 }
6109ms  RELEASE A_write_E_read_6        returning, locks will be released
```

This clearly demonstrates the lock contention; all six operations immediately
begin waiting for locks, and operations *A_read_B_write_1*, *A_read_C_write_4*
and *A_read_D_write_5* immediately get their locks granted.

Operation *A_read_B_write_1* gets a grant simply because it was first, and
that means *A_read_B_write_2* and *A_read_B_write_3* can't be granted locks
because they both want a *write lock* on *resource_b*, which is why
*A_read_C_write_4* and *A_read_D_write_5* are next, since the only lock
in common with *A_read_B_write_1* is a *read lock* on *resource_a* and
read locks aren't exclusive.

In this example *A_read_C_write_4* finishes next, which allows no other
operation to have locks granted. Then *A_read_B_write_1* finishes, which
was holding the *write lock* on *resource_b*, so *A_read_B_write_2* is
immediately granted locks when this happens.

Next *A_read_D_write_5* finishes, then *A_read_B_write_2*, which allows
*A_read_B_write_3* to proceed (which was blocked waiting for a *write
lock* on *resource_b*).

Finally when *A_read_B_write_3* finishes *A_write_E_read_6* can get a
look in, after being blocked the whole time waiting for a *write lock*
on *resource_a* which has been tied up by every other operation getting
read locks on it.

This example is run in the unit tests, but with shorter timeouts (100ms
to 200ms instead of 1s to 2s).

If your operation is purely synchronous (indicated by accepting no
arguments) it can return the result instead of calling `done`, like this:

```javascript
resource_manager.exec(
    function () {
        // locks have been granted
        console.log("starting operation");
        console.log("finishing operation");
        return retval;
        // locks are released
    },
    {'resource_a': 'read', 'resource_b': 'write'}
);
```

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
