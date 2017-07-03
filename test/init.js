(function () {


"use strict";


let polylock;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	polylock = require('./../dist/polylock.js');
	require('chai-jasmine');
} else {
	polylock = window.polylock;
}


describe('initialisation', function() {

	it('succeeds', function() {

		let db = new polylock();

	});

});


})();
