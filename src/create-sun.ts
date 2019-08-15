import Vec3 = require('gl-matrix/vec3');

const {cos, sin, PI} = Math;

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


export function getSunPosition(t: number) {
    const altitude = t * .8e-3;
    const azimuth = altitude;
    const x = sin(azimuth) * cos(altitude);
    const y = sin(azimuth) * sin(altitude);
    const z = cos(azimuth);
    return Vec3.fromValues(x, y, z);
}