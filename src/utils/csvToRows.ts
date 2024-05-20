import { readFileSync } from 'node:fs'

export const csvToRows = <T>(filepath: string): Array<T> => {
    const { rows } = readFileSync('./sample_msft.csv', 'utf-8').split('\n').reduce((a, row, i) => {
        const values = row.replaceAll('\"', '').split(',')
        if (i === 0) {
            const t = { ...a, keys: values.map((key) => key.toLowerCase()) }
            return t
        } else {
            const row = a.keys.reduce((a, key, i) => ({ ...a, [key]: values[i] }), {} as T)
            return { ...a, rows: [...a.rows, row] }
        }
    }, { rows: [], keys: [] } as { rows: Array<T>, keys: Array<string> })
    return rows
}