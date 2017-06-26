describe('uncontended read', function() {

	let db = new polylock();

	it('operation 1 promise resolves to return value', function(done) {

		let retval = 4365;

		let op_prom = db.exec(function (fff) {
			fff(retval);
		}, {});

		expect(op_prom).toBeResolvedWith(retval, done);

	});

	it('operation 2 promise resolves to return value', function(done) {

		let retval = 3654;

		let op_prom = db.exec(function (fff) {
			fff(retval);
		}, {resource: 'read'});

		expect(op_prom).toBeResolvedWith(retval, done);

	});

});

describe('uncontended write', function() {

	let db = new polylock();

	it('operation 1 promise resolves to return value', function(done) {

		let retval = 4356;

		let op_prom = db.exec(function (fff) {
			fff(retval);
		}, {resource: 'write'});

		expect(op_prom).toBeResolvedWith(retval, done);

	});

	it('operation 2 promise resolves to return value', function(done) {

		let retval = 5436;

		let op_prom = db.exec(function (fff) {
			fff(retval);
		}, {resource: 'write'});

		expect(op_prom).toBeResolvedWith(retval, done);

	});

});
