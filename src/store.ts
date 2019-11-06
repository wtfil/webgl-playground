import Vec3 = require('gl-matrix/vec3');
import {inRange, toggleViaQS} from './utils';
import {getSunPosition} from './create-sky';
import {FieldsOfType} from './types';

const INITIAL_STATE = {
    app: {
        // currently no used
        active: true,
        autoPilot: toggleViaQS('ap', false)
    },
    camera: {
        center: Vec3.fromValues(270, 330, 87),
        position: Vec3.fromValues(330, 414, 84)
    },
    terrain: {
        visible: true
    },
    water: {
        start: Date.now(),
        time: 0,
        visible: true,
        useReflection: toggleViaQS('rfl', true),
        useRefraction: toggleViaQS('rfr', true)
    },
    light: {
        // directional light
        direction: Vec3.fromValues(0, 0, 0),
        color: Vec3.fromValues(0, 0, 0),
    },
    sky: {
        dayTime: 9 * 3600 * 1000,
        // dayTime: 11500000,
        visible: true,
        sunPosition: Vec3.fromValues(0, 0, 0),
        autoSunMove: toggleViaQS('asm', false)
    }
}

export type State = typeof INITIAL_STATE;


export const getInitialState = () => {
    setDayTime(INITIAL_STATE, INITIAL_STATE.sky.dayTime)
    return INITIAL_STATE;
}

export const toggle = <
    K1 extends keyof State,
    K2 extends FieldsOfType<State[K1], boolean>,
>(
    state: State,
    key1: K1,
    key2: K2
) => {
    (state as any)[key1][key2] = !state[key1][key2];
}

export const zoom = (state: State, dz: number) => {
    const {position, center} = state.camera;
    const eye = Vec3.create();
    const distance = Vec3.distance(center, position);
    const nextDistance = inRange(distance + dz, 50, 1000);
    Vec3.sub(eye, position, center);
    Vec3.scale(eye, eye, nextDistance / distance);
    Vec3.add(position, center, eye);
}

export const moveCamera = (
    state: State,
    e: {
        left: number,
        forward: number,
        up: number
    }
) => {
    const {position, center} = state.camera;
    const forwardMove = Vec3.create();
    const leftMove = Vec3.create();
    const move = Vec3.create();
    Vec3.sub(forwardMove, center, position);
    Vec3.rotateZ(leftMove, forwardMove, [0, 0, 1], Math.PI / 2);
    leftMove[2] = 0;

    if (e.forward > 0) {
        Vec3.add(move, move, forwardMove);
    }
    if (e.forward < 0) {
        Vec3.sub(move, move, forwardMove);
    }
    if (e.left > 0) {
        Vec3.add(move, move, leftMove);
    }
    if (e.left < 0) {
        Vec3.sub(move, move, leftMove);
    }

    Vec3.normalize(move, move);
    Vec3.add(move, move, [0, 0, e.up]);
    Vec3.scale(move, move, 6);
    Vec3.add(position, position, move)
    Vec3.add(center, center, move);
}

export const rotateCamera = (state: State, dx: number, dy: number) => {
    const {position, center} = state.camera;
    const eye = Vec3.create();
    Vec3.sub(eye, center, position);
    const length = Vec3.length(eye);
    Vec3.rotateZ(eye, eye, [0, 0, 0], dx);
    eye[2] -= dy;
    Vec3.normalize(eye, eye);
    Vec3.scale(eye, eye, length);
    Vec3.add(center, position, eye);
}

export const moveSun = (state: State, dt: number) => {
    const DAY = 24 * 3600 * 1000;
    let dayTime = state.sky.dayTime + dt;
    if (dayTime < 0) {
        dayTime += DAY;
    } else if (dayTime > DAY) {
        dayTime -= DAY;
    }
    setDayTime(state, dayTime);
}
export const autoMoveSun = (state: State, spead: number) => {
    if (state.sky.autoSunMove) {
        moveSun(state, spead);
    }
}
export const updateWaterTime = (state: State) => {
    state.water.time = Date.now() - state.water.start;
}

export const autoPilot = (state: State) => {
    if (!state.app.autoPilot) {
        return;
    }
    rotateCamera(state, 0.003, 0);
}

const setDayTime = (state: State, time: number) => {
    const {
        sunPosition,
        directionalLightColor,
        directionalLightVector
    } = getSunPosition(time);
    state.sky.dayTime = time;
    state.sky.sunPosition = sunPosition;
    state.light.color = directionalLightColor;
    state.light.direction = directionalLightVector;
}