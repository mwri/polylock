const polylock = require('./../lib/index.js');
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
