import express from 'express';
import fs from 'fs'
import path from 'path'
import { tickers } from '../src/utils/tickers'
import { Bar, type IBar } from '../src/strategy/bar';
import { Predictor } from '../src/strategy/predictor';
import { Discretizer, Predict, Summary } from '../src/model/model';
import { TransitionMatrix } from '../src/matrix/transitionMatrix';
import { ConfusionMatrix } from '../src/matrix/confusionMatrix';
import { Buffer } from '../src/strategy/buffer';
import { Closed } from '../src/strategy/closed';
import { Sim, Disc, Bettor, VariDiscrete } from '../src/model/model'

export interface DataFile {
    results: Array<IBar>
}

const getBars = (ticker: string): Array<IBar> => {
    if (!tickers.includes(ticker)) throw new Error(`No ticker "${ticker}"`)
    const data = fs.readFileSync(`data/${ticker}.json`, 'utf8');
    const json: DataFile = JSON.parse(data)
    return json.results

}

const bufSize = 200
const thres = [.2, .4, 0.8]

const app = express();
const port = 3000;

app.set('view engine', 'ejs')

app.set('views', path.join(__dirname, 'views'));

app.get('/tmx/:ticker/:size', function (req, res) {
    const bars = getBars(req.params.ticker)

    const predictor = new Predictor(parseInt(req.params.size, 10))

    bars.forEach((bar) => {
        predictor.predict(new Bar(req.params.ticker, bar))
    })

    const labels = predictor.mxTransition.classes
    const values = predictor.mxTransition.stochastic().flatMap((row, y) => row.map((v, x) => ({
        x: predictor.mxTransition.matrix.xLabelOf(x),
        y: predictor.mxTransition.matrix.yLabelOf(y),
        v
    })))
    res.render('pages/tmx', { values, labels, max: 1 });
});

app.get('/sim/:ticker', (req, res) => {
    const discretizers = [
        new VariDiscrete("TREND", [-0.001], 1, ({ c, o }, ctx) => c - o),
        new VariDiscrete("CHG", [0.25, 0.5], 50, ({ o, c }, ctx) => {
            const value = c - o
            const { stddev } = ctx.sum.next(value)
            return value / stddev
        }),
        new VariDiscrete("VOL", [0.25, 0.5], 50, ({ v }, ctx) => {
            const { stddev } = ctx.sum.next(v)
            return v / stddev
        }),
    ]

    const labels = Sim.getLabels(discretizers)
    const sum = new Summary(500)
    const dis = new Disc(sum, thres)
    const bet = new Bettor(10_000, [])
    const tmx = new TransitionMatrix({
        labels: labels,
        value: Array
            .from(Array(labels.length))
            .map(() => Array(labels.length).fill(0))
    })
    const cmx = new ConfusionMatrix({
        labels: labels,
        value: Array
            .from(Array(labels.length))
            .map(() => Array(labels.length).fill(0))
    })
    const WINDOW_SIZE = 11_000
    const tBuf = new Buffer<Closed<string>>(WINDOW_SIZE)
    const cBuf = new Buffer<Closed<string>>(WINDOW_SIZE)
    const sim = new Sim(tmx, cmx, dis, bet, tBuf, cBuf, discretizers)

    // Read bars and simulate
    const bars = getBars(req.params.ticker)
    const values = []
    for (let i = 0; i < WINDOW_SIZE * 2 + 1000; i++) {
        const bar = bars[i]
        if (bar === undefined) throw new Error(`No bar at index ${i}. Array length is: ${bars.length}`)
        const t = sim.next(req.params.ticker, bar)
        if (t) values.push(t)
    }

    const tmxLabels = tmx.classes
    const tmxValues = tmx.stochastic().flatMap((row, y) => row.map((v, x) => ({
        x: tmx.matrix.xLabelOf(x),
        y: tmx.matrix.yLabelOf(y),
        v
    })))

    const cmxLabels = cmx.classes
    const cmxValues = cmx.value.flatMap((row, y) => row.map((v, x) => ({
        x: cmx.matrix.xLabelOf(x),
        y: cmx.matrix.yLabelOf(y),
        v
    })))

    res.render('pages/sim', {
        values,
        thres,
        tmxLabels,
        tmxValues,
        tmxSize: tmx.sum,
        cmxLabels,
        cmxValues,
        cmxSize: cmx.sum,
        perf: cmx.micro()
    })
})

app.get('/tmx2/:ticker', function (req, res) {
    const bars = getBars(req.params.ticker)

    const sum = new Summary(bufSize)

    const dis = new Discretizer(sum, thres)

    const tmx = new TransitionMatrix({
        labels: dis.labels,
        value: [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ]
    })

    const pre = new Predict(20_000, tmx)

    for (let i = 0; i < bars.length; i++) {
        const bar = bars[i]
        if (bar === undefined) continue
        const { state } = dis.increment(bar.c)
        if (state === undefined) continue
        pre.increment(state)
    }

    const labels = pre.tmx.classes
    const values = pre.tmx.stochastic().flatMap((row, y) => row.map((v, x) => ({
        x: pre.tmx.matrix.xLabelOf(x),
        y: pre.tmx.matrix.yLabelOf(y),
        v
    })))

    res.render('pages/tmx', { values, labels, max: 1 });
});


app.get('/discretize/:ticker/:start/:size', function (req, res) {
    const bars = getBars(req.params.ticker)

    const summary = new Summary(bufSize)
    const discretizer = new Discretizer(summary, thres)

    let i = parseInt(req.params.start) - bufSize
    let t = parseInt(req.params.start) + parseInt(req.params.size)
    const values = []
    for (i; i < t; i++) {
        const bar = bars[i]
        if (bar === undefined) continue
        const { state, change } = discretizer.increment(bar.c)
        if (state === undefined) continue
        values.push({
            discrete: state,
            stddev: summary.stddev(),
            price: bar.c,
            change
        })
    }
    res.render('pages/discrete', { values, thres })
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});