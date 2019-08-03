const polylock = require('./../lib/index.js');
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
