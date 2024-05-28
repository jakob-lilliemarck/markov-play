import { Bar } from 'types/financial'

export type MappedOmit<T, U, K extends PropertyKey> =
    { [P in keyof T as P extends K ? never : P]: U }

export type MappedValues<T, U> =
    { [P in keyof T]: U }

export type Translate = MappedOmit<Bar, [number, number], "date">

export type Transformable = MappedValues<Translate, number>

export const transform = (translate: Translate) => (bar: Transformable) => Object.entries(translate).reduce((a, [key, [step, precision]]) => {
    return ({
        ...a,
        [key]: (Math.floor((bar[key] / step)) * step).toFixed(precision)
    })
}, {})

/**
 * A function type that takes a map of keys for a type T and normalizes each key in the map by dividing with the specified value in the value.. 
 */

export const normalize = <
    T extends { [key: string]: number },
    U extends string
>(map: MappedOmit<T, string, U>) => (value: T) => {
    return Object.entries(map).reduce(
        (a, [k, v]) => ({
            ...a, [k]: value[k] / value[v as keyof T]
        }),
        {} as { [P in keyof MappedOmit<T, string, U>]: number }
    )
}
// To improve this, map needs to be generic, with constraints that all its keys must be also be present in T