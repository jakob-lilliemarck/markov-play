import fs from 'fs'
import { Discretizer } from "../src/model/model"
import { Bar, type IBar } from '../src/strategy/bar'

export interface DataFile {
    results: Array<IBar>
}

const ticker = "AAPL"

try {
    const data = fs.readFileSync(`data/${ticker}.json`, 'utf8');
    const bars: DataFile = JSON.parse(data)
    const discretizer = new Discretizer()
    bars.results.forEach((e, i) => {
        const bar = new Bar(ticker, e)
        const discrete = discretizer.increment(bar)
        if (i < 100) {
            console.log(discrete)
        }
    })
} catch (err) {
    console.error(err)
}