import { csvToRows } from "./utils"
import { Strategy } from "./bench"

const SAMPLE_CSV = './sample_msft.csv'

export interface Row {
    [key: string]: unknown
    date: string,
    open: string,
    high: string,
    low: string,
    close: string,
    volume: string
}

// Annotation - enrich the raw data with computed values
export interface Annotated extends Row {
    change?: number,
    group?: number,
    previousGroup?: number
}

const groups = [
    // group 0
    -1.0,
    // group 1
    -0.75,
    // group 2
    -0.5,
    // group 3
    -0.25,
    // group 4
    0.25,
    // group 5
    0.5,
    // group 6
    0.75,
    // group 7
    1.00
    // group 8
]

const getGroup = (value: number, groups: Array<number>) => groups.reduce(
    (a, thres, i) => value > thres ? i + 1 : a,
    0
)

export const toAnnotated = (current: Row, previous?: Annotated): Annotated => {
    if (previous) {
        const change = (parseFloat(current.close) / parseFloat(previous.close) - 1) * 100
        const group = getGroup(change, groups)
        return { ...current, change, group, previousGroup: previous.group }
    }
    return { ...current, change: undefined, group: undefined, previousGroup: undefined }
}

const toAnnotatedRows = (rows: Array<Row>) => {
    return rows.reduce((a, current, i) => {
        return [...a, toAnnotated(current, a[i - 1])]
    }, [] as Array<Annotated>).slice(2) // remove rows that miss previousGroup
}

// Construct a transition matrix of of groups
const normalizeVector = (vector: Array<number>) => {
    const sum = vector.reduce((a, n) => a + n)
    if (sum === 0) {
        const probability = 1 / vector.length
        return vector.map((_) => probability)
    }
    return vector.map((e) => e / sum)
}

const getTransitionMatrix = (annotated: Array<Annotated>) => {
    let matrix = Array.from(Array(groups.length + 1)).map(() => Array.from(Array(groups.length + 1)).map(() => 0))
    annotated.forEach(
        ({ group, previousGroup }) => {
            if (group !== undefined && previousGroup !== undefined) {
                matrix[previousGroup][group] += 1
            }
        }
    )
    return matrix.map(normalizeVector)
}

// Calculate the probabilities for a set of rows
const rows = csvToRows<Row>(SAMPLE_CSV).reverse()

const annotated = toAnnotatedRows(rows)

export const transitionMatrix = getTransitionMatrix(annotated)

const strategy: Strategy<Annotated> = {
    evaluate(row: Annotated) {
        return null
    }
}

const fmtPercentage = (factor: number) => `${(factor * 100).toFixed(2)}%`

//Array.from(Array(groups.length + 1)).forEach((_, i) => {
//    const thres = groups.length / 2
//    const { upside, downside, stagnant } = transitionMatrix[i].reduce((a, e, i) => {
//        return i > thres
//            ? { ...a, upside: a.upside + e }
//            : i < thres
//                ? { ...a, downside: a.downside + e }
//                : { ...a, stagnant: a.stagnant + e }
//    }, { upside: 0, downside: 0, stagnant: 0 })
//
//    console.log({
//        current: i,
//        signal: upside > downside ? 'BUY' : 'SELL',
//        upside: fmtPercentage(upside),
//        downside: fmtPercentage(downside),
//        stagnant: fmtPercentage(stagnant),
//        next: transitionMatrix[i].reduce((a, probability, i) => ({ ...a, [i]: fmtPercentage(probability) }), {})
//    })
//})
