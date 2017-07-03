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

	let db = new polylock();

	it('returns true when first available', function() {

		let take_result = db.take_locks({resource: 'write'});

		expect(take_result).toEqual(true);

	});

	it('returns false when not available', function() {

		let take_result = db.take_locks({resource: 'write'});

		expect(take_result).toEqual(false);

	});

});


})();
