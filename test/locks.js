let chai_jasmine = require('chai-jasmine');

let polylock = require('./../lib/index.js');


let seq = [];

function queue_op (db, name, locks, delay) {
    return db.exec(function (fff) {
        seq.push(name+'_start');
        setTimeout(function () {
            seq.push(name+'_end');
            fff();
        }, delay);
    }, locks);
}

function assert_seq (promises, expected_seq) {
    return Promise.all(promises).then(function () {
        expect(seq).toEqual(expected_seq);
    }).catch(function (err) {
        if (err.stack !== undefined)
            console.log(err.stack);
        throw err;
    });
}

let write_lock_tests = {
    'blocks writes': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'write'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'write'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr1_end',
            'pr2_start',
            'pr2_end',
        ]).then(function () { done(); });
    },
    'blocks reads': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'write'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'read'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr1_end',
            'pr2_start',
            'pr2_end',
        ]).then(function () { done(); });
    },
};

let mult_write_locks_tests = {
    'blocks mutliple write locks': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'write','b':'write'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'write','b':'write'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr1_end',
            'pr2_start',
            'pr2_end',
        ]).then(function () { done(); });
    },
    'blocks write locks (1)': function (done, db) {

        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'write','b':'write'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'write'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr1_end',
            'pr2_start',
            'pr2_end',
        ]).then(function () { done(); });

    },
    'blocks write locks (2)': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'write','b':'write'}, 5);
        let pr2 = queue_op(db, 'pr2', {'b':'write'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr1_end',
            'pr2_start',
            'pr2_end',
        ]).then(function () { done(); });
    },
    'blocked by write locks (1)': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'write'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'write','b':'write'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr1_end',
            'pr2_start',
            'pr2_end',
        ]).then(function () { done(); });
    },
    'blocked by write locks (2)': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'b':'write'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'write','b':'write'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr1_end',
            'pr2_start',
            'pr2_end',
        ]).then(function () { done(); });
    },
};

let read_lock_tests = {
    'blocks writes': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'read'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'write'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr1_end',
            'pr2_start',
            'pr2_end',
        ]).then(function () { done(); });
    },
    'permits other reads': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'read'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'read'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr2_start',
            'pr1_end',
            'pr2_end',
        ]).then(function () { done(); });
    },
};

let mult_read_locks_tests = {
    'blocks mutltiple write locks': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'read','b':'read'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'write','b':'write'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr1_end',
            'pr2_start',
            'pr2_end',
        ]).then(function () { done(); });
    },
    'blocks write locks (1)': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'read','b':'read'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'write'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr1_end',
            'pr2_start',
            'pr2_end',
        ]).then(function () { done(); });

    },
    'blocks write locks (2)': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'read','b':'read'}, 5);
        let pr2 = queue_op(db, 'pr2', {'b':'write'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr1_end',
            'pr2_start',
            'pr2_end',
        ]).then(function () { done(); });
    },
    'permits other multiple reads': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'read','b':'read'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'read','b':'read'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr2_start',
            'pr1_end',
            'pr2_end',
        ]).then(function () { done(); });
    },

    'permits other reads (1)': function (done, db) {

        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'read'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'read','b':'read'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr2_start',
            'pr1_end',
            'pr2_end',
        ]).then(function () { done(); });
    },
    'permits other reads (2)': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'b':'read'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'read','b':'read'}, 5);

        assert_seq([pr1, pr2], [
            'pr1_start',
            'pr2_start',
            'pr1_end',
            'pr2_end',
        ]).then(function () { done(); });
    },
};

let read_write_write_tests = {
    'runs in sequence': function (done, db) {
        seq = [];
        let pr1 = queue_op(db, 'pr1', {'a':'read'}, 5);
        let pr2 = queue_op(db, 'pr2', {'a':'write'}, 5);
        let pr3 = queue_op(db, 'pr3', {'a':'write'}, 5);

        assert_seq([pr1, pr2, pr3], [
            'pr1_start',
            'pr1_end',
            'pr2_start',
            'pr2_end',
            'pr3_start',
            'pr3_end',
        ]).then(function () { done(); });
    },
};

let test_sets = {
    'write lock':           write_lock_tests,
    'multiple write locks': mult_write_locks_tests,
    'read lock':            read_lock_tests,
    'multiple read locks':  mult_read_locks_tests,
    'read write write':     read_write_write_tests,
};

let cont_rp_db = new polylock({write_priority:false});
let cont_wp_db = new polylock({write_priority:true});

let test_set_descrs = Object.keys(test_sets);
for (let i = 0; i < test_set_descrs.length; i++) {
    add_test_set(test_set_descrs[i], test_sets[test_set_descrs[i]]);
}

function add_test_set (descr, tests) {
    describe(descr, function () {
        let test_descrs = Object.keys(tests);
        for (let i = 0; i < test_descrs.length; i++) {
            // run the tests against newly instantiated DBs
            let rp_db = new polylock({write_priority:false});
            add_test(test_descrs[i]+' (read priority) (no history)', tests[test_descrs[i]], rp_db);
            let wp_db = new polylock({write_priority:true});
            add_test(test_descrs[i]+' (write priority) (no history)', tests[test_descrs[i]], wp_db);
            // run the same tests against the continuous DBs
            add_test(test_descrs[i]+' (read priority) (previous state)', tests[test_descrs[i]], cont_rp_db);
            add_test(test_descrs[i]+' (write priority) (previous state)', tests[test_descrs[i]], cont_wp_db);
        }
    });
}

function add_test (descr, test_fun, db) {
    it(descr, function (done) {
        test_fun(done, db);
    });
}
