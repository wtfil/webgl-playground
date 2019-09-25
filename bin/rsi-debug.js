
// http://viclw17.github.io/2018/07/16/raytracing-ray-sphere-intersection/
/*
lowp float rsi(
    lowp vec3 origin,
    lowp vec3 direction,
    lowp float radius
) {
    lowp vec3 center = vec3(0.0); // could be used as parameter
    lowp vec3 oc = origin - center;
    lowp float a = dot(direction, direction);
    lowp float b = 2.0 * dot(direction, oc);
    lowp float c = dot(oc, oc) - radius * radius;
    lowp float d = b * b - 4.0 * a * c;
    if (d < 0.0) {
        return -1.0;
    }
    lowp float qd = sqrt(d);
    lowp float t = (-qd - b) / 2.0 / a;
    if (t >= 0.0) {
        return t;
    }
    t = (qd - b) / 2.0 / a;
    if (t > 0.0) {
        return t;
    }
    return -1.0;
}

*/
const {vec3: Vec3} = require('gl-matrix');
const length = Math.hypot;

const sub = (a, b) => {
    const c = Vec3.create();
    Vec3.sub(c, a, b);
    return c;
}

const dot = (a, b) => {
    return Vec3.dot(a, b);
}

function rsi(origin, direction, radius) {
    const center = Vec3.create();
    const os = sub(origin, center);
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