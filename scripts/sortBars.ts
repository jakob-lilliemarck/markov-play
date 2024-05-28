import fs from 'fs'
import { tickers } from '../src/utils/tickers'
import { fmtFilename } from '../src/utils/formatting'
import { IBar } from '../src/simulate/simulate'

// npx ts-node scripts/sortBars.ts 

const map = new Map<string, Array<IBar>>()

export interface DataFile {
    results: Array<IBar>
}

const buf: Array<[string, IBar]> = []

tickers.forEach((ticker) => {
    const filepath = fmtFilename(ticker)
    try {
        const data = fs.readFileSync(filepath, 'utf8');
        const json: DataFile = JSON.parse(data)
        const arr: Array<[string, IBar]> = json.results.map((bar) => [ticker, bar])
        buf.push(...arr)
    } catch (err) {
        console.error(err)
    }
})


try {
    const sorted = buf.sort((a, b) => a[1].t - b[1].t)
    fs.writeFileSync("data/sorted.json", JSON.stringify(sorted, null, 2), 'utf8');
    console.log('File has been saved.');
} catch (err) {
    console.error('Error writing file:', err);
}