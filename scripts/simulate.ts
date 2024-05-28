import fs from 'fs'
import { tickers } from '../src/utils/tickers'
import { Simulate } from '../src/simulate/simulate'
import { Strategy } from "../src/strategy/strategy"

// npx ts-node scripts/simulate.ts 

try {
    const data = fs.readFileSync("data/sorted.json", 'utf8');
    const bars = JSON.parse(data)
    const strategy = new Strategy(tickers)
    const simulate = new Simulate(strategy, bars)
    simulate.run()
} catch (err) {
    console.error(err)
}