import { ListDictionary } from './list_dictionary';

export interface LruCacheOptions {
    maxLength: number;
}

/**
 * Least recently used cache.
 */
export class LruCache<T = any> {
    listDictionary = new ListDictionary<T>();

    maxLength = this.options.maxLength;

    constructor(private options: LruCacheOptions) {
        if (typeof options.maxLength !== 'number') {
            throw new Error('Parameter "maxLength" must be a number.');
        }
    }

    /**
     * Gets the number of item in the list.
     */
    length() {
        return this.listDictionary.length();
    }

    /**
     * Get item from Cache and move to last position
     */
    get(key: string) {
        if (typeof key !== 'string') throw new Error('Parameter "key" must be a string.');
        const node = this.listDictionary.dictionary[key];
        if (!node) return null;
        // remove item and move it to the end of the list
        this.listDictionary.remove(key);
        this.listDictionary.add(key, node.data);
        return node.data;
    }

    /**
     * Add new item to cache, remove least used item if length exceeds maxLength
     */
    add(key: string, value: T) {
        const added = this.listDictionary.add(key, value);
        if (!added) return false;
        if (this.length() > this.maxLength) {
            this.listDictionary.removeFirst();
        }
        return true;
    }

    /**
     * Remove item with key
     */
    remove(key: string) {
        return this.listDictionary.remove(key);
    }

    /**
     * Clear cache
     */
    clear() {
        return this.listDictionary.clear();
    }
}
