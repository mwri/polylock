const polylock = require('./../lib/index.js');
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
    console.log(`${ts()}\tRELEASE\t${descr}\tcritical section done, releasing locks`);
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
