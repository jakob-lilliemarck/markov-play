import { describe, expect, test } from '@jest/globals';
import { Composed } from './composed'
import { sma } from './sma'


describe('sma', () => {
    test('test', async () => {
        const composed = new Composed<{ close: number }, { close: number }>()
            .append(sma(2, 'sma2'))
            .append(sma(4, 'sma4'))
            .append(sma(8, 'sma8'))

        const result = composed.eval([
            { close: 100 },
            { close: 101 },
            { close: 102 },
            { close: 103 },
            { close: 104 },
            { close: 105 },
            { close: 106 },
            { close: 107 },
            { close: 108 },
            { close: 109 }
        ])

        expect(result[0].sma2).toBe(undefined)
        expect(result[1].sma2).toBe(100.5)
        expect(result[2].sma4).toBe(undefined)
        expect(result[3].sma4).toBe(101.5)
        expect(result[6].sma8).toBe(undefined)
        expect(result[7].sma8).toBe(103.5)
    })
})