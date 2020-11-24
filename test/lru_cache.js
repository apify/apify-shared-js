import _ from 'underscore';
import { assert } from 'chai';
import LruCache from '../build/lru_cache';

// asserts that linked list and dictionary is equivalent to an array of [{key: Object, value: Object}] objects
const assertSame = function (lru, array) {
    assert.equal(lru.length(), array.length);
    const { dictionary } = lru.listDictionary;
    assert.equal(_.keys(dictionary).length, array.length);

    // iterate linked list forwards and check all invariants
    const list = lru.listDictionary.linkedList;
    let i = 0;
    for (let node = list.head; node !== null; node = node.next, i++) {
        assert.equal(node.data, array[i].value);
        assert.equal(dictionary[array[i].key], node);
        assert.equal(node.data, array[i].value);
    }

    assert.equal(i, array.length);
};

describe('lru_cache', () => {
    it('works with basic params', () => {
        const cache = new LruCache({ maxLength: 100 });
        const added = cache.add('foo', 'bar');
        assert.equal(added, true);
        let value = cache.get('foo');
        assert.equal(value, 'bar');
        const removed = cache.remove('foo');
        assert.equal(removed, 'bar');
        value = cache.get('foo');
        assert.equal(value, null);
    });
    describe('#add()', () => {
        it('just works', () => {
            const lru = new LruCache({ maxLength: 5000 });
            const array = [];

            // check invalid params
            assert.throws(() => { lru.add(null, 'val'); }, Error);
            assert.throws(() => { lru.add(123, 'val'); }, Error);
            assert.throws(() => { lru.add(true, 'val'); }, Error);
            assert.throws(() => { lru.add(false, 'val'); }, Error);
            assert.throws(() => { lru.add({}, 'val'); }, Error);
            assert.throws(() => { lru.add(null, null); }, Error);

            // add various new elements
            assert(lru.add('', 'empty'));
            array.push({ key: '', value: 'empty' });
            assertSame(lru, array);

            assert(lru.add('123', 'val123'));
            array.push({ key: '123', value: 'val123' });
            assertSame(lru, array);

            assert(lru.add('null', null));
            array.push({ key: 'null', value: null });
            assertSame(lru, array);

            assert(lru.add('undefined', undefined));
            array.push({ key: 'undefined', value: undefined });
            assertSame(lru, array);

            const obj = {};
            assert(lru.add('obj', obj));
            array.push({ key: 'obj', value: obj });
            assertSame(lru, array);

            assert(lru.add('true', 'valTrue'));
            array.push({ key: 'true', value: 'valTrue' });
            assertSame(lru, array);

            assert(lru.add('123.456', 'val123.456'));
            array.push({ key: '123.456', value: 'val123.456' });
            assertSame(lru, array);

            // add to back
            for (let i = 0; i < 50; i++) {
                assert(lru.add(`key${i}`, `val${i}`));
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(lru, array);
            }

            // add already added elements
            for (let i = 0; i < 50; i++) {
                assert(!lru.add(`key${i}`, `val${i}`));
                assertSame(lru, array);
            }
        });
        it('does not exceed maxLength', () => {
            const lru = new LruCache({ maxLength: 5 });
            const array = [];
            for (let i = 0; i < 10; i++) {
                lru.add(`key${i}`, `val${i}`);
                if (i > 4) {
                    array.shift();
                }
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(lru, array);
            }
        });
    });

    describe('#get()', () => {
        it('just works', () => {
            const lru = new LruCache({ maxLength: 100 });
            const array = [];

            // check invalid params
            assert.throws(() => { lru.get(null); }, Error);
            assert.throws(() => { lru.get(123); }, Error);
            assert.throws(() => { lru.get(true); }, Error);
            assert.throws(() => { lru.get(false); }, Error);
            assert.throws(() => { lru.get({}); }, Error);

            assert(lru.add('', 'empty'));
            array.push({ key: '', value: 'empty' });
            assertSame(lru, array);

            assert(lru.add('null', null));
            array.push({ key: 'null', value: null });
            assertSame(lru, array);

            // add to back
            for (let i = 0; i < 50; i++) {
                assert(lru.add(`key${i}`, `val${i}`));
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(lru, array);
            }

            // try get existing items
            assert.equal(lru.get('null'), null);
            assert.equal(lru.get(''), 'empty');
            const indexes = _.shuffle(_.range(50));
            indexes.forEach((i) => {
                assert.equal(lru.get(`key${i}`), `val${i}`, `index is ${i}`);
            });

            // try get non-existing items
            assert.equal(lru.get('key51'), null);
            assert.equal(lru.get('123'), null);
            assert.equal(lru.get('true'), null);
        });

        it('move last recently used item to the end', () => {
            const lru = new LruCache({ maxLength: 100 });
            const array = [];
            for (let i = 0; i < 50; i++) {
                assert(lru.add(`key${i}`, `val${i}`));
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(lru, array);
            }
            lru.get('key0');
            const firstItem = array.shift();
            array.push(firstItem);
            assertSame(lru, array);
        });
    });
    //
    //
    describe('#remove()', () => {
        it('just works', () => {
            const lru = new LruCache({ maxLength: 1000 });
            let array = [];

            // check invalid params
            assert.throws(() => { lru.remove(null); }, Error);
            assert.throws(() => { lru.remove(123); }, Error);
            assert.throws(() => { lru.remove(true); }, Error);
            assert.throws(() => { lru.remove(false); }, Error);
            assert.throws(() => { lru.remove({}); }, Error);

            assert(lru.add('', 'empty'));
            array.push({ key: '', value: 'empty' });
            assertSame(lru, array);

            assert(lru.add('null', null));
            array.push({ key: 'null', value: null });
            assertSame(lru, array);

            // add to back
            for (let i = 0; i < 50; i++) {
                assert(lru.add(`key${i}`, `val${i}`));
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(lru, array);
            }

            // try remove all items
            assert.equal(lru.remove(''), 'empty');
            array = _.filter(array, (elem) => { return elem.key !== ''; });
            assertSame(lru, array);

            assert.equal(lru.remove('null'), null);
            array = _.filter(array, (elem) => { return elem.key !== 'null'; });
            assertSame(lru, array);

            // try remove non-existent items
            assert.equal(lru.remove('bla bla'), null);
            assertSame(lru, array);
            assert.equal(lru.remove(''), null);
            assertSame(lru, array);

            const indexes = _.shuffle(_.range(50));
            indexes.forEach((i) => {
                assert.equal(lru.remove(`key${i}`), `val${i}`);
                array = _.filter(array, (elem) => { return elem.key !== `key${i}`; });
                assertSame(lru, array);
            });

            assertSame(lru, []);
        });
    });

    describe('#clear()', () => {
        it('just works', () => {
            const lru = new LruCache({ maxLength: 1000 });
            let array = [];

            // add few elements
            for (let i = 0; i < 50; i++) {
                assert(lru.add(`key${i}`, `val${i}`));
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(lru, array);
            }

            lru.clear();
            array = [];
            assertSame(lru, array);

            lru.clear();
            array = [];
            assertSame(lru, array);
        });
    });
});
