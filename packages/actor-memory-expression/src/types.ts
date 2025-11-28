import type { EvalFunction } from 'mathjs';

export type ActorRunOptions = {
    build?: string;
    timeoutSecs?: number;
    memoryMbytes?: number; // probably no one will need it, but let's keep it consistent
    diskMbytes?: number; // probably no one will need it, but let's keep it consistent
    maxItems?: number;
    maxTotalChargeUsd?: number;
    restartOnError?: boolean;
}

export type MemoryEvaluationContext = {
    runOptions: ActorRunOptions;
    input: Record<string, unknown>;
}

export type CompilationCache = {
    get: (expression: string) => Promise<EvalFunction | null>;
    set: (expression: string, compilationResult: EvalFunction) => Promise<void>;
    size: () => Promise<number>;
}

export type CompilationResult = EvalFunction;
