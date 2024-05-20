import { describe, expect, test } from '@jest/globals';
import { Row } from '../data/model';

type Hash = string

class Matrix {
    private _increments: number
    private _states: Map<string, number>
    private _indexToStates: Map<number, string>
    private _rows: Array<Array<number>>
    private _previousHash?: Hash
    private _size: number

    constructor(row: Row) {
        this._increments = 0
        this._rows = [[0]]
        this._size = 1
        this._states = new Map<string, number>()
        this._indexToStates = new Map<number, string>()
        this._previousHash = Matrix.hash(row)
        this.saveHash(this._previousHash, 0)
    }

    private saveHash(hash: string, index: number) {
        this._states.set(hash, index)
        this._indexToStates.set(index, hash)
    }

    /**
     * 
     * @param row Hashes a row to use as a key in the matrix
     * @returns string
     */
    private static hash(row: Row): Hash {
        return Object
            .entries(row)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}:${value}`)
            .join('-')
    }

    /**
     * Grow the matrix with unseen event hashes
     * @param hash A string hash of the row value
     * @returns the index of the new event
     */
    private grow(hash: Hash): number {
        if (this._states.has(hash)) throw new Error(`Can't grow existing hash`)
        this._size += 1
        this._rows = this._rows.map((row) => [...row, 0])
        this._rows.push(Array.from(Array(this._size)).map((_) => 0))
        const index = this._size - 1
        this.saveHash(hash, index)
        return index
    }

    /**
     * Train the model on one new increment
     * @param row The row to hash and increment
     */
    increment(row: Row) {
        const currentHash = Matrix.hash(row)
        if (this._previousHash) {
            const x = this._states.get(currentHash)
            const y = this._states.get(this._previousHash)
            if (y !== undefined) {
                if (x !== undefined) {
                    this._rows[y][x] += 1
                } else {
                    const i = this.grow(currentHash)
                    this._rows[y][i] += 1
                }
            } else {
                const i = this.grow(currentHash)
                this._rows[i][i] += 1
            }
        }
        this._previousHash = currentHash
        this._increments += 1
    }

    probe(row: Row) {
        const hash = Matrix.hash(row)
        const i = this._states.get(hash)
        if (i === undefined) throw new Error("unknown event")
        const sum = this._rows[i].reduce((a, e) => a + e, 0)
        return this._rows[i].map((e, j, arr) => ({
            hash: this._indexToStates.get(j),
            probability: sum !== 0
                ? e / sum
                : 1 / arr.length
        }))
    }
}

describe('re-trainable transition matrix', () => {
    test('increment training', async () => {
        const m = new Matrix({ close: 100 })
        // There is only one known event.
        // In the event of unkown probabilities the expected result is equal probability between all events, which is 100% of close:100 while it's the only type.
        expect(m.probe({ close: 100 })).toStrictEqual([
            { hash: 'close:100', probability: 1 }
        ])

        m.increment({ close: 102 })
        // Now there are two known events close:102 and close:100
        // close:102 is the only one known to follow close:100
        expect(m.probe({ close: 100 })).toStrictEqual([
            { hash: 'close:100', probability: 0 },
            { hash: 'close:102', probability: 1 }
        ])

        m.increment({ close: 104 })
        m.increment({ close: 102 })
        m.increment({ close: 100 })
        // Three known events, close:100, close:102 and close:104
        // close:102 is known to transition once to close:104 and once to close:100, so equal probability of 50% are expected
        expect(m.probe({ close: 102 })).toStrictEqual([
            { hash: 'close:100', probability: 0.5 },
            { hash: 'close:102', probability: 0 },
            { hash: 'close:104', probability: 0.5 }
        ])

        m.increment({ close: 104 })
        m.increment({ close: 100 })
        m.increment({ close: 104 })
        m.increment({ close: 100 })
        m.increment({ close: 100 })
        // Same amount of events, but with new probabilities.
        // close:100 have transitioned to close:102 once, close:104 twice and to itself, close:100, once. Probabilities as follows
        expect(m.probe({ close: 100 })).toStrictEqual([
            { hash: 'close:100', probability: 0.25 },
            { hash: 'close:102', probability: 0.25 },
            { hash: 'close:104', probability: 0.5 }
        ])
    })
})