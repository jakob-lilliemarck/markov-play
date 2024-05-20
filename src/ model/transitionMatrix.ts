import { normalize } from "path"

class Row {
    private _value: number[]

    constructor(value: number[]) {
        this._value = value
    }

    get normal() {
        const sum = this._value.reduce((a, e) => a + e, 0)
        return this._value.map((e) => sum !== 0 ? e / sum : 1 / sum)
    }

    static createEmpty(size: number) {
        return new Row(Array.from(Array(size)).map((_) => 0))
    }

    get size() {
        return this._value.length
    }

    static add(a: Row, b: Row) {
        if (a.size !== b.size) {
            throw new Error('Addition requires vectors to be of same size')
        }
        return new Row(a._value.map((a, i) => a + b._value[i]))
    }
}

interface Labels {
    row: string[],
    column: string[]
}

export class TransitionMatrix {
    private _rows: Row[]
    private _size: number

    constructor(rows: Row[]) {
        this._rows = rows
        this._size = rows.length
    }

    static fromSize(size: number, labels: Labels) {
        const rows = Array.from(Array(size)).map((_) => Row.createEmpty(size))
        return new TransitionMatrix(rows)
    }

    get size() {
        return this._size
    }

    static add(a: TransitionMatrix, b: TransitionMatrix) {
        if (a.size !== b.size) {
            throw new Error('Addition requires matrices to be of the same size')
        }
        const rows = a._rows.map((a, i) => Row.add(a, b._rows[i]))
        return new TransitionMatrix(rows)
    }
}

