import { LinkedList } from '@apify/datastructures';

// asserts that linked list is equivalent to an array
const assertSame = function (list: LinkedList, array: any[]) {
    expect(list.length).toBe(array.length);

    // iterate list forwards
    let i = 0;
    for (let node = list.head; node != null; node = node.next, i++) {
        expect(node.data).toBe(array[i]);
    }
    expect(i).toBe(array.length);

    // iterate list backwards
    i = array.length - 1;
    for (let node = list.tail; node != null; node = node.prev, i--) {
        expect(node.data).toBe(array[i]);
    }
    expect(i).toBe(-1);
};

describe('linked_list', () => {
    describe('#add()', () => {
        it('just works', () => {
            const list = new LinkedList();
            const array: any[] = [];
            assertSame(list, array);

            for (let i = 0; i < 10; i++) {
                list.add(i);
                array.push(i);
                assertSame(list, array);
            }

            for (let i = 10; i < 20; i++) {
                list.add(i, true);
                array.unshift(i);
                assertSame(list, array);
            }

            list.add(null);
            array.push(null);
            assertSame(list, array);

            list.add(undefined);
            array.push(undefined);
            assertSame(list, array);
        });
    });

    describe('#addNode()', () => {
        it('just works', () => {
            const list = new LinkedList();
            const array: any[] = [];
            assertSame(list, array);

            list.addNode({ data: 'test1' });
            array.push('test1');
            assertSame(list, array);

            list.addNode({ data: 'test2' }, true);
            array.unshift('test2');
            assertSame(list, array);

            list.addNode({ data: 'test3' }, false);
            array.push('test3');
            assertSame(list, array);

            list.addNode({ data: 'test4' }, true);
            array.unshift('test4');
            assertSame(list, array);

            // check invalid params
            // @ts-expect-error
            expect(() => { list.addNode(null); }).toThrow();
            // @ts-expect-error
            expect(() => { list.addNode(undefined); }).toThrow();
            // @ts-expect-error
            expect(() => { list.addNode('blabla'); }).toThrow();
            // @ts-expect-error
            expect(() => { list.addNode(123); }).toThrow();
            // @ts-expect-error
            expect(() => { list.addNode(true); }).toThrow();
            // @ts-expect-error
            expect(() => { list.addNode(false); }).toThrow();
            // @ts-expect-error
            expect(() => { list.addNode({ prev: {} }); }).toThrow();
            // @ts-expect-error
            expect(() => { list.addNode({ next: {} }); }).toThrow();
        });
    });

    describe('#find()', () => {
        it('just works', () => {
            const list = new LinkedList();
            const obj = {};
            const objWithEquals = { equals(other: any) { return !!other && other.xxx; } };
            list.add(123);
            list.add('test');
            list.add(0.123);
            list.add(true);
            list.add(null);
            list.add(obj);
            list.add(objWithEquals);

            expect(list.find(123)?.data).toBe(123);
            expect(list.find('test')?.data).toBe('test');
            expect(list.find(0.123)?.data).toBe(0.123);
            expect(list.find(true)?.data).toBe(true);
            expect(list.find(null)?.data).toBe(null);
            expect(list.find(obj)?.data).toBe(obj);
            expect(list.find({ xxx: true })?.data).toBe(objWithEquals);

            expect(list.find(-123)).toBe(null);
            expect(list.find('testx')).toBe(null);
            expect(list.find(0.456)).toBe(null);
            expect(list.find(false)).toBe(null);
            expect(list.find(undefined)).toBe(null);
        });
    });

    describe('#removeNode()', () => {
        it('just works', () => {
            const list = new LinkedList();
            let array: any[] = [];
            assertSame(list, array);

            // add testing items
            for (let i = 0; i < 100; i++) {
                list.add(i);
                array.push(i);
                assertSame(list, array);
            }

            // remove selected items
            [33, 0, 99, 45, 15].forEach((val) => {
                list.removeNode(list.find(val)!);
                array = array.filter((i) => { return i !== val; });
                assertSame(list, array);
            });

            // remove all items
            while (list.length > 0) {
                expect(list.removeFirst()).toBe(array.shift());
                assertSame(list, array);
            }

            expect(list.removeFirst()).toBe(null);
            assertSame(list, []);

            // check invalid params
            // @ts-expect-error
            expect(() => { list.removeNode(null); }).toThrow();
            // @ts-expect-error
            expect(() => { list.removeNode(undefined); }).toThrow();
            // @ts-expect-error
            expect(() => { list.removeNode(true); }).toThrow();
            // @ts-expect-error
            expect(() => { list.removeNode(false); }).toThrow();
            // @ts-expect-error
            expect(() => { list.removeNode(''); }).toThrow();
        });
    });
});
