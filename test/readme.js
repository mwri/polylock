let chai_jasmine = require('chai-jasmine');

let polylock = require('./../lib/index.js');


describe('old readme', function () {
    it('works', function (test_done) {
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
            test_done();
        }).catch(function (err) {
            console.log('mayday mayday, its all gone wrong: '+err);
            test_done.fail();
        });
    });

    it('fails (sync)', function (test_done) {
        let resource_manager = new polylock();

        let prom = resource_manager.exec(function (done, fail) {
            // locks have been granted
            console.log("starting operation");
            if (true === true) {
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
            test_done.fail();
        }).catch(function (err) {
            console.log('mayday mayday, its all gone wrong: '+err);
            test_done();
        });
    });

    it('fails (async)', function (test_done) {
        let resource_manager = new polylock();

        let prom = resource_manager.exec(function (done, fail) {
            // locks have been granted
            console.log("starting operation");
            if (true === false) {
                // this is a (synchronous) bug in the operation
                throw new Error('tarantula');
            }
            setTimeout(function () {
                if (true === true) {
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
            test_done.fail();
        }).catch(function (err) {
            console.log('mayday mayday, its all gone wrong: '+err);
            test_done();
        });
    });
});


describe('old readme (sync example)', function () {
    it('works', function (test_done) {
        let resource_manager = new polylock();

        let prom = resource_manager.exec(function () {
            // locks have been granted
            console.log("starting operation");
            let retval = Math.floor(Math.random()*10);
            console.log("finishing operation (returning "+retval+")");
            return retval;
            // locks are released
        }, {'resource_a': 'read', 'resource_b': 'write'});

        prom.then(function (val) {
            // operation has been finished
            console.log("operation done, result was "+val);
            test_done();
        }).catch(function (err) {
            console.log('mayday mayday, its all gone wrong: '+err);
            test_done.fail();
        });
    });
});


describe('old readme (all promises example)', function () {
    it('works', function (test_done) {
        let resource_manager = new polylock();

        resource_manager.wait(
            {'resource_a': 'read', 'resource_b': 'write'}
        ).then(function (release) {
            // locks have been granted
            console.log("starting operation");
            return new Promise(function (timeout_fff) {
                setTimeout(function () {
                    let retval = Math.floor(Math.random()*10);
                    console.log("finishing operation (returning "+retval+")");
                    // finish the operation
                    timeout_fff(retval);
                    release();
                    // locks are released
                }, 1000);
            });
        }).then(function (val) {
            // operation has been finished
            console.log("operation done, result was "+val);
            test_done();
        });
    });
});


describe('readme', function () {
    describe('promises_hello', function () {
        it('works', function () {
            let resource_manager = new polylock();
            let start_ms = (new Date()).getTime();

            console.log(`${new Date()}  waiting A`);
            let a = resource_manager
                .wait({'resource_a': 'write'})
                .then((release) => {
                    console.log(`${new Date()}  begin A`);
                    return new Promise((resolve) => {
                        setTimeout(resolve, 200);
                    }).then(() => {
                        console.log(`${new Date()}  end A`);
                        release();
                    });
                });

            console.log(`${new Date()}  waiting B`);
            let b = resource_manager
                .wait({'resource_a': 'write'})
                .then((release) => {
                    console.log(`${new Date()}  begin B`);
                    return new Promise((resolve) => {
                        setTimeout(resolve, 200);
                    }).then(() => {
                        console.log(`${new Date()}  end B`);
                        release();
                    });
                });

            console.log(`${new Date()}  waiting C`);
            let c = resource_manager
                .wait({'resource_a': 'write'})
                .then((release) => {
                    console.log(`${new Date()}  begin C`);
                    return new Promise((resolve) => {
                        setTimeout(resolve, 200);
                    }).then(() => {
                        console.log(`${new Date()}  end C`);
                        release();
                    });
                });

            return Promise.all([a, b, c]);
        });
    });

    describe('promises_more', function () {
        it('works', function () {
            let resource_manager = new polylock();
            let start_ms = (new Date()).getTime();

            return Promise.all([
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
                        100 + Math.floor(Math.random() * 100)
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
        });
    });

    describe('asyncawait_hello', function () {
        it('works', async function () {
            let resource_manager = new polylock();
            let start_ms = (new Date()).getTime();

            async function contend (op) {
                console.log(`${new Date()}  waiting ${op}`);
                let release = await resource_manager.wait({'resource_a': 'write'});
                console.log(`${new Date()}  begin A`);
                await new Promise((resolve) => setTimeout(resolve, 200));
                console.log(`${new Date()}  end A`);
                release();
            }

            await Promise.all([
                contend('A'),
                contend('B'),
                contend('C'),
            ]);
        });
    });

    describe('asyncawait_more', function () {
        it('works', async function () {
            let resource_manager = new polylock();
            let start_ms = (new Date()).getTime();

            await Promise.all([
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
                await new Promise((resolve) => setTimeout(resolve, 100 + Math.floor(Math.random() * 100)));
                console.log(`${ts()}\tCOMMIT\t${descr}\tfinished async operation`);
                return {
                    'operation': descr,
                    'result':    Math.floor(Math.random() * 100),
                };
            }

            function ts () {
                return `${(new Date()).getTime() - start_ms}ms`;
            }
        });
    });

    describe('callback_hello', function () {
        it('works', function () {
            let resource_manager = new polylock();
            let start_ms = (new Date()).getTime();

            console.log(`${new Date()}  waiting A`);
            let a = resource_manager.exec(
                function (done, fail) {
                    console.log(`${new Date()}  begin A`);
                    setTimeout(function () {
                        console.log(`${new Date()}  end A`);
                        done();
                    }, 200);
                },
                {'resource_a': 'write'}
            );

            console.log(`${new Date()}  waiting B`);
            let b = resource_manager.exec(
                function (done, fail) {
                    console.log(`${new Date()}  begin B`);
                    setTimeout(function () {
                        console.log(`${new Date()}  end B`);
                        done();
                    }, 200);
                },
                {'resource_a': 'write'}
            );

            console.log(`${new Date()}  waiting C`);
            let c = resource_manager.exec(
                function (done, fail) {
                    console.log(`${new Date()}  begin C`);
                    setTimeout(function () {
                        console.log(`${new Date()}  end C`);
                        done();
                    }, 200);
                },
                {'resource_a': 'write'}
            );

            return Promise.all([a, b, c]);
        });
    });

    describe('callback_more', function () {
        it('works', function () {
            let resource_manager = new polylock();
            let start_ms = (new Date()).getTime();

            let a = contended({'resource_a': 'read',  'resource_b': 'write'}, 'A_read_B_write_1');
            let b = contended({'resource_a': 'read',  'resource_b': 'write'}, 'A_read_B_write_2');
            let c = contended({'resource_a': 'read',  'resource_b': 'write'}, 'A_read_B_write_3');
            let d = contended({'resource_a': 'read',  'resource_c': 'write'}, 'A_read_C_write_4');
            let e = contended({'resource_a': 'read',  'resource_d': 'write'}, 'A_read_D_write_5');
            let f = contended({'resource_a': 'write', 'resource_e': 'read' }, 'A_write_E_read_6');

            return Promise.all([a, b, c, d, e, f]);

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
                    100 + Math.floor(Math.random() * 100)
                );
            }

            function ts () {
                return `${(new Date()).getTime() - start_ms}ms`;
            }
        });
    });
});
