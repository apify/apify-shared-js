import _ from 'underscore';
import { LruCache } from '@apify/datastructures';

// asserts that linked list and dictionary is equivalent to an array of [{key: Object, value: Object}] objects
const assertSame = function (lru: LruCache, array: any[]) {
    expect(lru.length()).toBe(array.length);
    const { dictionary } = lru.listDictionary;
    expect(Object.keys(dictionary).length).toBe(array.length);

    // iterate linked list forwards and check all invariants
    // @ts-ignore access to private property
    const list = lru.listDictionary.linkedList;
    let i = 0;
    for (let node = list.head; node != null; node = node.next, i++) {
        expect(node.data).toBe(array[i].value);
        expect(dictionary[array[i].key]).toEqual(node);
        expect(node.data).toBe(array[i].value);
    }

    expect(i).toBe(array.length);
};

describe('lru_cache', () => {
    it('works with basic params', () => {
        const cache = new LruCache({ maxLength: 100 });
        const added = cache.add('foo', 'bar');
        expect(added).toBe(true);
        let value = cache.get('foo');
        expect(value).toBe('bar');
        const removed = cache.remove('foo');
        expect(removed).toBe('bar');
        value = cache.get('foo');
        expect(value).toBe(null);
    });
    describe('#add()', () => {
        it('just works', () => {
            const lru = new LruCache({ maxLength: 5000 });
            const array = [];

            // check invalid params
            // @ts-expect-error
            expect(() => { lru.add(null, 'val'); }).toThrow();
            // @ts-expect-error
            expect(() => { lru.add(123, 'val'); }).toThrow();
            // @ts-expect-error
            expect(() => { lru.add(true, 'val'); }).toThrow();
            // @ts-expect-error
            expect(() => { lru.add(false, 'val'); }).toThrow();
            // @ts-expect-error
            expect(() => { lru.add({}, 'val'); }).toThrow();
            // @ts-expect-error
            expect(() => { lru.add(null, null); }).toThrow();

            // add various new elements
            expect(lru.add('', 'empty')).toBe(true);
            array.push({ key: '', value: 'empty' });
            assertSame(lru, array);

            expect(lru.add('123', 'val123')).toBe(true);
            array.push({ key: '123', value: 'val123' });
            assertSame(lru, array);

            expect(lru.add('null', null)).toBe(true);
            array.push({ key: 'null', value: null });
            assertSame(lru, array);

            expect(lru.add('undefined', undefined)).toBe(true);
            array.push({ key: 'undefined', value: undefined });
            assertSame(lru, array);

            const obj = {};
            expect(lru.add('obj', obj)).toBe(true);
            array.push({ key: 'obj', value: obj });
            assertSame(lru, array);

            expect(lru.add('true', 'valTrue')).toBe(true);
            array.push({ key: 'true', value: 'valTrue' });
            assertSame(lru, array);

            expect(lru.add('123.456', 'val123.456')).toBe(true);
            array.push({ key: '123.456', value: 'val123.456' });
            assertSame(lru, array);

            // add to back
            for (let i = 0; i < 50; i++) {
                expect(lru.add(`key${i}`, `val${i}`)).toBe(true);
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(lru, array);
            }

            // add already added elements
            for (let i = 0; i < 50; i++) {
                expect(!lru.add(`key${i}`, `val${i}`)).toBe(true);
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
            // @ts-expect-error
            expect(() => { lru.get(null); }).toThrow();
            // @ts-expect-error
            expect(() => { lru.get(123); }).toThrow();
            // @ts-expect-error
            expect(() => { lru.get(true); }).toThrow();
            // @ts-expect-error
            expect(() => { lru.get(false); }).toThrow();
            // @ts-expect-error
            expect(() => { lru.get({}); }).toThrow();

            expect(lru.add('', 'empty')).toBe(true);
            array.push({ key: '', value: 'empty' });
            assertSame(lru, array);

            expect(lru.add('null', null)).toBe(true);
            array.push({ key: 'null', value: null });
            assertSame(lru, array);

            // add to back
            for (let i = 0; i < 50; i++) {
                expect(lru.add(`key${i}`, `val${i}`)).toBe(true);
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(lru, array);
            }

            // try get existing items
            expect(lru.get('null')).toBe(null);
            expect(lru.get('')).toBe('empty');
            const indexes = _.shuffle(_.range(50));
            indexes.forEach((i) => {
                expect(lru.get(`key${i}`)).toBe(`val${i}`);
            });

            // try get non-existing items
            expect(lru.get('key51')).toBe(null);
            expect(lru.get('123')).toBe(null);
            expect(lru.get('true')).toBe(null);
        });

        it('move last recently used item to the end', () => {
            const lru = new LruCache({ maxLength: 100 });
            const array = [];
            for (let i = 0; i < 50; i++) {
                expect(lru.add(`key${i}`, `val${i}`)).toBe(true);
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
            let array: any[] = [];

            // check invalid params
            // @ts-expect-error
            expect(() => { lru.remove(null); }).toThrow();
            // @ts-expect-error
            expect(() => { lru.remove(123); }).toThrow();
            // @ts-expect-error
            expect(() => { lru.remove(true); }).toThrow();
            // @ts-expect-error
            expect(() => { lru.remove(false); }).toThrow();
            // @ts-expect-error
            expect(() => { lru.remove({}); }).toThrow();

            expect(lru.add('', 'empty')).toBe(true);
            array.push({ key: '', value: 'empty' });
            assertSame(lru, array);

            expect(lru.add('null', null)).toBe(true);
            array.push({ key: 'null', value: null });
            assertSame(lru, array);

            // add to back
            for (let i = 0; i < 50; i++) {
                expect(lru.add(`key${i}`, `val${i}`)).toBe(true);
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(lru, array);
            }

            // try remove all items
            expect(lru.remove('')).toBe('empty');
            array = array.filter((elem) => elem.key !== '');
            assertSame(lru, array);

            expect(lru.remove('null')).toBe(null);
            array = array.filter((elem) => elem.key !== 'null');
            assertSame(lru, array);

            // try remove non-existent items
            expect(lru.remove('bla bla')).toBe(null);
            assertSame(lru, array);
            expect(lru.remove('')).toBe(null);
            assertSame(lru, array);

            const indexes = _.shuffle(_.range(50));
            indexes.forEach((i) => {
                expect(lru.remove(`key${i}`)).toBe(`val${i}`);
                array = array.filter((elem) => elem.key !== `key${i}`);
                assertSame(lru, array);
            });

            assertSame(lru, []);
        });
    });

    describe('#clear()', () => {
        it('just works', () => {
            const lru = new LruCache({ maxLength: 1000 });
            let array: any[] = [];

            // add few elements
            for (let i = 0; i < 50; i++) {
                expect(lru.add(`key${i}`, `val${i}`)).toBe(true);
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
