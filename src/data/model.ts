export interface Row {
    [key: string]: unknown
}

export interface Bar extends Row {
    [key: string]: unknown
    date: string,
    open: string,
    high: string,
    low: string,
    close: string,
    volume: string
}

export type Callback<T extends Row, U extends T> = (
    e: T,
    i: number,
    arr: Array<T>
) => U;