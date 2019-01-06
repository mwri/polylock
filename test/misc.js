(function () {


"use strict";


let polylock;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	polylock = require('./../dist/polylock.js');
	require('chai-jasmine');
} else {
	polylock = window.polylock;
}


describe('taking locks', function() {

	it('returns true when first available', function() {

		let db = new polylock();

		let take_result = db.take_locks({resource: 'write'});

		expect(take_result).toEqual(true);

	});

	it('returns false when not available', function() {

		let db = new polylock();

		expect(db.take_locks({resource: 'write'})).toEqual(true);
		expect(db.take_locks({resource: 'write'})).toEqual(false);

	});

});


})();
