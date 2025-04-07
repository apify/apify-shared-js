/*!
 * This module defines the ListDictionary class, a data structure
 * that combines a linked list and a dictionary.
 *
 * Author: Jan Curn (jan@apify.com)
 * Copyright(c) 2015 Apify. All rights reserved.
 *
 */

import type { LinkedListNode } from './linked_list';
import { LinkedList } from './linked_list';

/**
 * The main ListDictionary class.
 */
export class ListDictionary<T = unknown> {
    private linkedList = new LinkedList<T>();

    dictionary: Record<string, LinkedListNode<T>> = {};

    /**
     * Gets the number of item in the list.
     */
    length() {
        return this.linkedList.length;
    }

    /**
     * Adds an item to the list. If there is already an item with same key, the function
     * returns false and doesn't make any changes. Otherwise, it returns true.
     */
    add(key: string, item: T, toFirstPosition?: boolean) {
        if (typeof key !== 'string') throw new Error('Parameter "key" must be a string.');
        if (key in this.dictionary) return false;

        const linkedListNode = this.linkedList.add(item, toFirstPosition);
        linkedListNode.dictKey = key;
        this.dictionary[key] = linkedListNode;

        return true;
    }

    /**
     * Gets the first item in the list. The function returns null if the list is empty.
     */
    getFirst() {
        const { head } = this.linkedList;
        if (head) return head.data;

        return null;
    }

    /**
     * Gets the last item in the list. The function returns null if the list is empty.
     */
    getLast() {
        const { tail } = this.linkedList;
        if (tail) return tail.data;

        return null;
    }

    /**
     * Gets the first item from the list and moves it to the end of the list.
     * The function returns null if the queue is empty.
     */
    moveFirstToEnd() {
        const node = this.linkedList.head;

        if (!node) return null;

        this.linkedList.removeNode(node);
        this.linkedList.addNode(node);

        return node.data;
    }

    /**
     * Removes the first item from the list.
     * The function returns the item or null if the list is empty.
     */
    removeFirst() {
        const { head } = this.linkedList;

        if (!head) return null;

        this.linkedList.removeNode(head);
        delete this.dictionary[head.dictKey!];

        return head.data;
    }

    /**
     * Removes the last item from the list.
     * The function returns the item or null if the list is empty.
     */
    removeLast() {
        const { tail } = this.linkedList;

        if (!tail) return null;

        this.linkedList.removeNode(tail);
        delete this.dictionary[tail.dictKey!];

        return tail.data;
    }

    /**
     * Removes an item identified by a key. The function returns the
     * object if it was found or null if it wasn't.
     */
    remove(key: string) {
        if (typeof key !== 'string') throw new Error('Parameter "key" must be a string.');

        const node = this.dictionary[key];

        if (!node) return null;

        delete this.dictionary[key];
        this.linkedList.removeNode(node);

        return node.data;
    }

    /**
     * Finds a request based on the URL.
     */
    get(key: string) {
        if (typeof key !== 'string') throw new Error('Parameter "key" must be a string.');
        const node = this.dictionary[key];

        if (!node) return null;

        return node.data;
    }

    /**
     * Removes all items from the list.
     */
    clear() {
        if (this.linkedList.length > 0) {
            this.linkedList = new LinkedList<T>();
            this.dictionary = {};
        }
    }
}
