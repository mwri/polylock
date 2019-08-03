let chai_jasmine = require('chai-jasmine');

let polylock = require('./../lib/index.js');


describe('initialisation', function () {
    it('succeeds', function () {
        let db = new polylock();
    });
});
