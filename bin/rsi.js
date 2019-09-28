// http://viclw17.github.io/2018/07/16/raytracing-ray-sphere-intersection/
const {vec3: Vec3} = require('gl-matrix');
const sqrt = Math.sqrt;

const sub = (a, b) => {
    const c = Vec3.create();
    Vec3.sub(c, a, b);
    return c;
}

const dot = (a, b) => {
    return Vec3.dot(a, b);
}
const er = 6371e3;
const ar = 6471e3;

function rsi(origin, direction, radius) {
    const center = Vec3.create();
    const oc = sub(origin, center);
    const a = dot(direction, direction);
    const b = 2 * dot(direction, oc);
    const c = dot(oc, oc) - radius * radius;
    const d = b * b - 4 * a * c;
    if (d < 0) {
        console.log('<0')
        return -1;
    }
    const qd = sqrt(d);
    let t = (-qd - b) / 2 / a;
    if (t >= 0) {
        console.log('-qd')
        return t;
    }
    t = (qd - b) / 2 / a;
    if (t > 0) {
        console.log('+qd')
        return t;
    }
    console.log('no res')
    return -1;
}

console.log(rsi(
    [0, 0, er],
    [-0.522657779758489, -0.7233261840096428, 0.4512516778738614],
    ar
));

console.log(rsi(
    [0, 0, er],
    [0.7542687324870708, -0.6561626163473974, 0.023006522998613093],
    ar
));

console.log(rsi(
    [0, 0, er],
    [0.7881026349933807, -0.6155431574478489, 0.0009263021228666318],
    ar
));
console.log(sqrt(ar * ar - er * er))