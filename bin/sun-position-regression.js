/**
 * @see https://planetcalc.com/4270/
 * Some values of sun position are taken for random day
 * Concrete values of azimuth and altitude will be linear interpolated in given range
 **/
const SOME_DAY_POSITIONS = [
    {
        time: '00:00',
        azimuth: -8.86,
        altitude: -20.31
    },
    // sunrise
    {
        time: '05:10',
        azimuth: 65.21,
        altitude: -0.09
    },
    // zenith
    {
        time: '12:30',
        azimuth: 178.63,
        altitude: 47.82
    },
    // sunset
    {
        time: '19:55',
        azimuth: 294.26,
        altitude: 0.24
    },
    {
        time: '23:55',
        azimuth: 349.96,
        altitude: -20.20
    },
];

const URL = 'https://www.wolframalpha.com/input/?i=';

function timeToTs(time) {
    const [h, m] = time.split(':').map(Number);
    return (h * 60 + m) * 60 * 1000;
}

function createInputForWolframalpha(points) {
    const azimuth = points
        .map(point => {
            const ts = timeToTs(point.time);
            return `{${ts},${point.azimuth / 180 * Math.PI}}`;
        })
        .join(', ')
    const altitude = points
        .map(point => {
            const ts = timeToTs(point.time);
            return `{${ts},${Math.atan(point.altitude / 180 * Math.PI).toFixed(4)}}`;
        })
        .join(', ')

    console.log(`
        Azimuth:
        aimuzh = a * t + b
        ${azimuth}
        ${URL}linear fit${encodeURIComponent(azimuth)}
    `)

    console.log(`
        Altitude:
        altitude = tan(a * t ^ 2 + b * t + c)
        ${altitude}
        ${URL}quadratic fit${encodeURIComponent(altitude)}
    `)
}

createInputForWolframalpha(SOME_DAY_POSITIONS)