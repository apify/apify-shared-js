import _ from 'underscore';
import { ListDictionary } from '@apify/datastructures';

// asserts that linked list is equivalent to an array of [{key: Object, value: Object}] objects
const assertSame = function (ld: any, array: any) {
    expect(ld.length()).toBe(array.length);
    expect(Object.keys(ld.dictionary).length).toBe(array.length);

    // iterate linked list forwards and check all invariants
    const list = ld.linkedList;
    let i = 0;
    for (let node = list.head; node !== null; node = node.next, i++) {
        expect(node.data).toBe(array[i].value);
        expect(ld.dictionary[array[i].key]).toBe(node);
        expect(node.data).toBe(array[i].value);
    }

    expect(i).toBe(array.length);
};

describe('list_dictionary', () => {
    describe('#add()', () => {
        it('just works', () => {
            const ld = new ListDictionary();
            const array: any[] = [];

            // check invalid params
            // @ts-expect-error
            expect(() => { ld.add(null, 'val'); }).toThrow();
            // @ts-expect-error
            expect(() => { ld.add(123, 'val'); }).toThrow();
            // @ts-expect-error
            expect(() => { ld.add(true, 'val'); }).toThrow();
            // @ts-expect-error
            expect(() => { ld.add(false, 'val'); }).toThrow();
            // @ts-expect-error
            expect(() => { ld.add({}, 'val'); }).toThrow();
            // @ts-expect-error
            expect(() => { ld.add(null, null); }).toThrow();

            // add various new elements
            expect(ld.add('', 'empty')).toBe(true);
            array.push({ key: '', value: 'empty' });
            assertSame(ld, array);

            expect(ld.add('123', 'val123')).toBe(true);
            array.push({ key: '123', value: 'val123' });
            assertSame(ld, array);

            expect(ld.add('null', null)).toBe(true);
            array.push({ key: 'null', value: null });
            assertSame(ld, array);

            expect(ld.add('undefined', undefined)).toBe(true);
            array.push({ key: 'undefined', value: undefined });
            assertSame(ld, array);

            const obj = {};
            expect(ld.add('obj', obj)).toBe(true);
            array.push({ key: 'obj', value: obj });
            assertSame(ld, array);

            expect(ld.add('true', 'valTrue', true)).toBe(true);
            array.unshift({ key: 'true', value: 'valTrue' });
            assertSame(ld, array);

            expect(ld.add('123.456', 'val123.456', false)).toBe(true);
            array.push({ key: '123.456', value: 'val123.456' });
            assertSame(ld, array);

            // add to back
            for (let i = 0; i < 50; i++) {
                expect(ld.add(`key${i}`, `val${i}`)).toBe(true);
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(ld, array);
            }

            // add to front
            for (let i = 50; i < 100; i++) {
                expect(ld.add(`key${i}`, `val${i}`, true)).toBe(true);
                array.unshift({ key: `key${i}`, value: `val${i}` });
                assertSame(ld, array);
            }

            // add already added elements
            for (let i = 0; i < 100; i++) {
                expect(!ld.add(`key${i}`, `val${i}`)).toBe(true);
                assertSame(ld, array);
            }
        });
    });

    describe('#get()', () => {
        it('just works', () => {
            const ld = new ListDictionary();
            const array: any[] = [];

            // check invalid params
            // @ts-expect-error
            expect(() => { ld.get(null); }).toThrow();
            // @ts-expect-error
            expect(() => { ld.get(123); }).toThrow();
            // @ts-expect-error
            expect(() => { ld.get(true); }).toThrow();
            // @ts-expect-error
            expect(() => { ld.get(false); }).toThrow();
            // @ts-expect-error
            expect(() => { ld.get({}); }).toThrow();

            expect(ld.add('', 'empty')).toBe(true);
            array.push({ key: '', value: 'empty' });
            assertSame(ld, array);

            expect(ld.add('null', null)).toBe(true);
            array.push({ key: 'null', value: null });
            assertSame(ld, array);

            // add to back
            for (let i = 0; i < 50; i++) {
                expect(ld.add(`key${i}`, `val${i}`)).toBe(true);
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(ld, array);
            }

            // try get existing items
            expect(ld.get('null')).toBe(null);
            expect(ld.get('')).toBe('empty');
            const indexes = _.shuffle(_.range(50));
            indexes.forEach((i) => {
                expect(ld.get(`key${i}`)).toBe(`val${i}`);
                assertSame(ld, array);
            });

            // try get non-existing items
            expect(ld.get('key51')).toBe(null);
            expect(ld.get('123')).toBe(null);
            expect(ld.get('true')).toBe(null);
        });
    });

    describe('#remove()', () => {
        it('just works', () => {
            const ld = new ListDictionary();
            let array: any[] = [];

            // check invalid params
            // @ts-expect-error
            expect(() => { ld.remove(null); }).toThrow();
            // @ts-expect-error
            expect(() => { ld.remove(123); }).toThrow();
            // @ts-expect-error
            expect(() => { ld.remove(true); }).toThrow();
            // @ts-expect-error
            expect(() => { ld.remove(false); }).toThrow();
            // @ts-expect-error
            expect(() => { ld.remove({}); }).toThrow();

            expect(ld.add('', 'empty')).toBe(true);
            array.push({ key: '', value: 'empty' });
            assertSame(ld, array);

            expect(ld.add('null', null)).toBe(true);
            array.push({ key: 'null', value: null });
            assertSame(ld, array);

            // add to back
            for (let i = 0; i < 50; i++) {
                expect(ld.add(`key${i}`, `val${i}`)).toBe(true);
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(ld, array);
            }

            // try remove all items
            expect(ld.remove('')).toBe('empty');
            array = array.filter((elem) => { return elem.key !== ''; });
            assertSame(ld, array);

            expect(ld.remove('null')).toBe(null);
            array = array.filter((elem) => { return elem.key !== 'null'; });
            assertSame(ld, array);

            // try remove non-existent items
            expect(ld.remove('bla bla')).toBe(null);
            assertSame(ld, array);
            expect(ld.remove('')).toBe(null);
            assertSame(ld, array);

            const indexes = _.shuffle(_.range(50));
            indexes.forEach((i) => {
                expect(ld.remove(`key${i}`)).toBe(`val${i}`);
                array = array.filter((elem) => { return elem.key !== `key${i}`; });
                assertSame(ld, array);
            });

            assertSame(ld, []);
        });
    });

    describe('#getFirst() #removeFirst()', () => {
        it('just works', () => {
            const ld = new ListDictionary();
            const array: any[] = [];
            assertSame(ld, array);

            expect(ld.getFirst()).toBe(null);
            assertSame(ld, array);

            for (let i = 0; i < 10; i++) {
                expect(ld.add(`key${i}`, `val${i}`)).toBe(true);
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(ld, array);
            }

            while (ld.length() > 0) {
                expect(ld.getFirst()).toBe(array[0].value);
                assertSame(ld, array);

                expect(ld.removeFirst()).toBe(array.shift().value);
                assertSame(ld, array);
            }

            expect(ld.getFirst()).toBe(null);
            assertSame(ld, array);

            expect(ld.removeFirst()).toBe(null);
            assertSame(ld, array);
        });
    });

    describe('#getLast() #removeLast()', () => {
        it('just works', () => {
            const ld = new ListDictionary();
            const array: any[] = [];
            assertSame(ld, array);

            expect(ld.getLast()).toBe(null);
            assertSame(ld, array);

            for (let i = 0; i < 10; i++) {
                expect(ld.add(`key${i}`, `val${i}`)).toBe(true);
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(ld, array);
            }

            while (ld.length() > 0) {
                expect(ld.getLast()).toBe(array[array.length - 1].value);
                assertSame(ld, array);

                expect(ld.removeLast()).toBe(array.pop().value);
                assertSame(ld, array);
            }

            expect(ld.getLast()).toBe(null);
            assertSame(ld, array);

            expect(ld.removeLast()).toBe(null);
            assertSame(ld, array);
        });
    });

    describe('#moveFirstToEnd()', () => {
        it('just works', () => {
            const ld = new ListDictionary();
            const array: any[] = [];

            expect(ld.moveFirstToEnd()).toBe(null);
            assertSame(ld, array);

            // add to back
            for (let i = 0; i < 50; i++) {
                expect(ld.add(`key${i}`, `val${i}`)).toBe(true);
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(ld, array);
            }

            // try move 1
            expect(ld.moveFirstToEnd()).toBe('val0');
            array.push(array[0]);
            array.shift();
            assertSame(ld, array);

            // try move 2
            expect(ld.moveFirstToEnd()).toBe('val1');
            array.push(array[0]);
            array.shift();
            assertSame(ld, array);
        });
    });

    describe('#clear()', () => {
        it('just works', () => {
            const ld = new ListDictionary();
            let array: any[] = [];

            // add few elements
            for (let i = 0; i < 50; i++) {
                expect(ld.add(`key${i}`, `val${i}`)).toBe(true);
                array.push({ key: `key${i}`, value: `val${i}` });
                assertSame(ld, array);
            }

            ld.clear();
            array = [];
            assertSame(ld, array);

            ld.clear();
            array = [];
            assertSame(ld, array);
        });
    });
});
