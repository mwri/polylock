const polylock = require('./../lib/index.js');
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
