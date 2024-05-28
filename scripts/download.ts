import { writeFile } from 'node:fs/promises'
import { fmtFilename } from '../src/utils/formatting'
import { tickers } from '../src/utils/tickers'

// npx ts-node scripts/download.ts 

const BASE_URL = "https://api.polygon.io/v2/aggs/ticker"
const API_KEY = "pCDylatW8jwQCXIaOqf8NcpcUQJMipib"
const LIMIT = "50000"
const SORT = 'asc'
const ADJUSTED = "true"
const START = "2024-01-01"
const END = "2024-03-31"
const MULTIPLIER = "1"
const TIMESPAN = "minute"

const getUrl = (ticker: string) => `${BASE_URL}/${ticker}/range/${MULTIPLIER}/${TIMESPAN}/${START}/${END}?adjusted=${ADJUSTED}&sort=${SORT}&limit=${LIMIT}&apiKey=${API_KEY}`

const download = async (ticker: string) => new Promise((resolve) => {
    setTimeout(async () => {
        await fetch(getUrl(ticker))
            .then((x) => x.arrayBuffer())
            .then((x) => writeFile(fmtFilename(ticker), Buffer.from(x)))
        resolve(undefined)
    }, 12_000)
})

const downloadAll = async () => {
    for (const ticker of tickers) {
        await download(ticker)
    }
}

downloadAll()