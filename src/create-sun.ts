import Vec3 = require('gl-matrix/vec3');
const {cos, sin, PI} = Math;
const secToRadian = (x: number) => x / 60 / 180 * PI;

export function createSun() {
    const c = 50;
    const r = 1000;
    const position = [];
    const indices = [];

    for (let i = 0; i <= c; i ++) {
        const b = PI / c * i - PI / 2;
        for (let j = 0; j < c; j ++) {
            const a = PI * 2 / c * j;
            const x = r * cos(a) * cos(b);
            const y = r * sin(a) * cos(b);
            const z = r * sin(b);
            const k = i * c + j;
            position.push(x, y, z);
            if (i !== c) {
                if (j === c - 1) {
                    const k1 = k;
                    const k2 = i * c;
                    const k3 = k + c;
                    const k4 = k + 1;
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
    }
    
    return {position, indices};
}


// @see https://en.wikipedia.org/wiki/Position_of_the_Sun
export function getSunPosition(t: number) {
    const n = t * 2;
    const L = secToRadian(280.460 + 0.9856474 * n);
    const g = secToRadian(357.528 + 0.9865003 * n);
    const lambda =  L + secToRadian(1.915 * sin(g) + 0.02 * sin(g * 2));
    const R = 1.00014 - 0.01671 * cos(g) - 0.00014 * cos(g * 2);
    const epsilon = secToRadian(23.439 - 0.0000004 * n);

    const x = R * cos(epsilon) * cos(lambda);
    const y = R * cos(epsilon) * sin(lambda);
    const z = R * sin(epsilon);
    return Vec3.fromValues(x / 2 + 0.5, y / 2 + 0.5, z);
}