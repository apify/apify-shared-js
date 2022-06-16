declare module 'match-all' {
    interface MatchAllResult {
        input: string;
        regex: RegExp;
        next(): string | null;
        nextRaw(): RegExpExecArray | null;
        toArray(): (string | null)[];
        reset(index?: number): number;
    }

    function matchAll(input: string, pattern: RegExp): MatchAllResult;

    export = matchAll;
}
