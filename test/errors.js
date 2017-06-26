let db = new polylock();

describe('non function operation', function() {

	it('results in a rejected promise', function(done) {

		let op_prom = db.exec(5, {});

		expect(op_prom).toBeRejected(done);

	});

});

describe('operation throwing error object', function() {

	it('results in promise rejection', function(done) {

		let err = new Error('here be dragons');

		let op_prom = db.exec(function (fff) {
			throw err;
		}, {});

		expect(op_prom).toBeRejected(done);

	});

});

describe('operation calling the rejection callback with an error object', function() {

	it('results in promise rejection', function(done) {

		let err = new Error('here be dragons');

		let op_prom = db.exec(function (fff, rej) {
			rej(err);
		});

		expect(op_prom).toBeRejected(done);

	});

});

describe('operation throwing error string', function() {

	it('results in promise rejection', function(done) {

		let err = 'here be dragons';

		let op_prom = db.exec(function (fff) {
			throw err;
		}, {});

		expect(op_prom).toBeRejected(done);

	});

});

describe('operation calling the rejection callback with an error object', function() {

	it('results in promise rejection', function(done) {

		let err = 'here be dragons';

		let op_prom = db.exec(function (fff, rej) {
			rej(err);
		}, {});

		expect(op_prom).toBeRejected(done);

	});

});

describe('operation crashing', function() {

	it('results in promise rejection', function(done) {

		let op_prom = db.exec(function (fff, rej) {
			fff(10/0);
		}, {});

		expect(op_prom).toBeRejected(done);

	});

});
