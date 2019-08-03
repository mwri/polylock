const polylock = require('./../lib/index.js');
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
