import { EmissionMatrix } from "./emissionMatrix"
import { TransitionMatrix } from "./transitionMatrix"
import { Square, Asymetric } from "./matrix"

export interface HmmDto {
    transitionMatrix: Square,
    emissionMatrix: Asymetric
}

export class Hmm {
    emissionMatrix: EmissionMatrix
    transitionMatrix: TransitionMatrix
    private previous?: string

    constructor(dto?: HmmDto) {
        // TODO - guard that emissionMatrix y-length equal transitionMatrix length, and that labels are identical and ordered along emissionMatrix y-axis and the transitionMatrix 
        this.emissionMatrix = new EmissionMatrix(dto?.emissionMatrix)
        this.transitionMatrix = new TransitionMatrix(dto?.transitionMatrix)
    }

    /**
     * Add one observation of what state was emitted from a (previously) hidden state.
     * The first increment will increment the emission matrix, but not the transition matrix 
     * as the transitioned to state is not yet known.
     * The observed hidden state is cached and used on the next call to this function.
     * @param hidden The observed hidden state
     * @param emitted The observed emitted state
     */
    increment(
        hidden: string,
        emitted: string
    ) {
        this.emissionMatrix.increment(hidden, emitted)
        if (this.previous) {
            this.transitionMatrix.increment(this.previous, hidden)
        }
        this.previous = hidden
    }

    /**
     * Format a cache key used to cache calculations at each depth level in the recursion
     * @param level The level of recursion depth this function was made at. 1 at the stem and higher numbers closer to leafs
     * @param index The hiddenState index
     * @returns string
     */
    private static fmtCacheKey(
        level: number,
        index: number
    ): string {
        return `a${level}(x${index})`
    }

    /**
     * Get a value from the cache or calculate it
     * @param key The cache key used to get cached values from the cache
     * @param cache Hashmap cache
     * @param callback Calculation callback
     * @returns 
     */
    private static getOrCalculate(
        key: string,
        cache: Map<string, number>,
        callback: () => number
    ): number {
        let value;
        value = cache.get(key)
        if (!value) {
            value = callback()
            cache.set(key, value)
        }
        return value
    }

    /**
     * Retrieve a value known to be in the from the cache. Otherwise throws an error
     * @param level Recursion depth level
     * @param index Index of the hiddenState used to compute the cached value
     * @param cache Cache hashmap
     * @returns The cached number
     */
    private static cachedAt(
        level: number,
        index: number,
        cache: Map<string, number>
    ): number {
        const key = Hmm.fmtCacheKey(level, index)
        const value = cache.get(key)
        if (!value) throw Hmm.errCacheMiss(key)
        return value
    }

    /**
     * Recursivly compute the probability of a sequence of emitted events
     * @param iHiddenTo The index of the hiddenState that's transitioned to at the level of recursion depth 
     * @param iHiddenFrom Array of indices for each hidden state the current state could have transitioned from.
     * @param seq Array of emitted states
     * @param pi The stationary probability distribution to use
     * @param buf Map buffer used to store and return partial results. Used to avoid unneccessary re-calculation 
     * @returns The buffer Map
     */
    private recv(
        iHiddenTo: number,
        iHiddenFrom: Array<number>,
        seq: Array<number>,
        pi: Array<number>,
        buf: Map<string, number>
    ): Map<string, number> {
        const [emitted, ...rest] = seq
        const key = Hmm.fmtCacheKey(seq.length, iHiddenTo)
        const eProbability = this.emissionMatrix.valAt(emitted, iHiddenTo)
        if (rest.length > 0) {
            const value = iHiddenFrom.reduce((a, i) => {
                this.recv(i, iHiddenFrom, rest, pi, buf)
                const tProbability = this.transitionMatrix.valAt(iHiddenTo, i)
                return a + Hmm.cachedAt(seq.length - 1, i, buf) * Hmm.getOrCalculate(
                    `(x${i}|x${iHiddenTo})(y${emitted}|x${iHiddenTo})`,
                    buf,
                    () => tProbability * eProbability
                )
            }, 0)
            buf.set(key, value)
            return buf
        } else {
            Hmm.getOrCalculate(key, buf, () => pi[iHiddenTo] * eProbability)
            return buf
        }
    }

    /**
     * Computes the probability of a specified sequence of emitted states for each stationary distribution.
     * @param seq Sequence of observed emitted states
     * @returns Array of probabilities to observe the specified sequence of emitted states. Each value in the array correspond to each found stationary distribution.
     */
    forward(seq: Array<string>): Array<number> {
        const iHiddenFrom = this.transitionMatrix.indices
        const emissionIndices = seq.reduceRight((a, e) => {
            const iEmitted = this.emissionMatrix.emittedIndexOf(e)
            return [...a, iEmitted]
        }, [] as number[])

        return this.transitionMatrix.pi().map((pi) => {
            const cache = new Map()
            iHiddenFrom.forEach((i) => this.recv(
                i,
                iHiddenFrom,
                emissionIndices,
                pi,
                cache
            ))
            return iHiddenFrom.reduce((a, i) => {
                const value = Hmm.cachedAt(seq.length, i, cache)
                return a + value
            }, 0)
        })
    }

    private static errCacheMiss(key: string) {
        return new Error(`Cache miss at "${key}"`)
    }
}