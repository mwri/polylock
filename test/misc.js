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
