import { Callback } from './composed'

export const sma = <T extends string, U extends { close: number }>(
    depth: number,
    key: T
): Callback<U, U & { [K in T]: number | undefined }> => (e, i, arr) => {
    // include the current value in the window
    const end = i + 1
    // start the window at depth indices from start
    const start = end - depth
    if (start >= 0) {
        const sma = arr.slice(start, end).reduce((a, e) => a + e.close, 0) / depth;
        return { ...e, [key]: sma } as U & { [K in T]: number };
    } else {
        return { ...e, [key]: undefined } as U & { [K in T]: undefined };
    }
};