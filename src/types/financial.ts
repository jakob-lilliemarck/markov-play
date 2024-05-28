export interface Row {
    [key: string]: unknown
}

export interface Bar extends Row {
    [key: string]: unknown
    date: string,
    open: number,
    high: number,
    low: number
    close: number,
    volume: number
}