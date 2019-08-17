import Vec3 = require('gl-matrix/vec3');

const {cos, sin, tan, PI} = Math;

export function createSun() {
    const c = 50;
    const position = [];
    const indices = [];

    for (let i = 0; i <= c; i ++) {
        const b = PI / c * i - PI / 2;
        for (let j = 0; j < c; j ++) {
            const a = PI * 2 / c * j;
            const x = cos(a) * cos(b);
            const y = sin(a) * cos(b);
            const z = sin(b);
            const k = i * c + j;
            position.push(x, y, z);
            if (i === c) {
                continue;
            }
            if (j === c - 1) {
                indices.push(
                    i * c, k + c, k,
                    k + c, k + 1, i * c
                );
            } else {
                indices.push(
                    k, k + 1, k + c,
                    k + 1, k + c, k + c + 1
                );
            }
        }
    }
    
    return {position, indices};
}



/**
 * @see ./bin/sun-positon-regression.js
 */

function getAzimuth(t: number) {
    return 7.344052639206152e-8 * t - 0.1829595519336553;
}
function getAltitude(t: number) {
    return tan(-4.83049e-16 * t * t + 4.21414e-8 * t - 0.420437);
}

const DAY_SPEED = 1e-3;

export function getSunPosition(n: number) {
    const t = (n * DAY_SPEED) % 24 * 3600 * 1000;
    const minutes = Math.ceil(t / 60 / 1000);
    const m = minutes % 60;
    const h = Math.floor(minutes / 60);
    const altitude = getAltitude(t);
    const azimuth = getAzimuth(t);
    const x = cos(altitude) * cos(azimuth);
    const y = cos(altitude) * sin(azimuth);
    const z = sin(altitude);
    return {
        sunTime: `${h}:${m}`,
        altitude,
        azimuth,
        sunPosition: Vec3.fromValues(x, -y, z)
    };
}