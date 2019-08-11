import Vec3 = require('gl-matrix/vec3');

export function createSun() {
    const s = 1;
    const position = [
        -s, -s, +1,
        +s, -s, +1,
        +s, +s, +1,
        -s, -s, +1,
        +s, +s, +1,
        -s, +s, +1
    ];
    const indices = [
        0, 1, 2,
        3, 4, 5
    ];

    return {position, indices};
}

const {cos, sin, PI} = Math;
const secToRadian = (x: number) => x / 60 / 180 * PI;

// @see https://en.wikipedia.org/wiki/Position_of_the_Sun
export function getSunPosition(t: number) {
    const n = t * 5;
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