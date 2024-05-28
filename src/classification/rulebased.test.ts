import { describe, expect, test } from '@jest/globals';
import { transform, type Translate, Transformable, normalize } from './rulebased'

describe('translate', () => {
    test('Round to predefined steps', async () => {
        const translate: Translate = {
            open: [.2, 1],
            close: [.3, 1],
            high: [.1, 1],
            low: [.5, 1],
            volume: [100, 0]
        }

        const transformable: Transformable = {
            open: 100.31,
            close: 101.63,
            high: 102.11,
            low: 100.97,
            volume: 1234
        }

        expect(transform(translate)(transformable))
            .toStrictEqual({
                open: "100.2",
                close: "101.4",
                high: "102.1",
                low: "100.5",
                volume: "1200"
            })
    })

    test('Normalize the values of a row', async () => {
        const bar = {
            high: 105.30,
            low: 100.20,
            open: 101.80,
            close: 103.75,
            volume: 10020,
        }

        const map = {
            high: "open",
            low: "open",
            close: "open",
            open: "open",
            volume: "volume"
        }

        const normalized = normalize(map)(bar)
    })
})