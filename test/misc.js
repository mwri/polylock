let chai_jasmine = require('chai-jasmine');

let polylock = require('./../lib/index.js');


describe('taking locks', function () {
    it('returns true when first available', function () {
        let db = new polylock();

        let take_result = db.take_locks({resource: 'write'});

        expect(take_result).toEqual(true);
    });

    it('returns false when not available', function () {
        let db = new polylock();

        expect(db.take_locks({resource: 'write'})).toEqual(true);
        expect(db.take_locks({resource: 'write'})).toEqual(false);
    });
});
