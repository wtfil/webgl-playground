import Vec3 = require('gl-matrix/vec3');
import Mat4 = require('gl-matrix/mat4');
import {createProgram, bindArraysToBuffers, createMatrices, bindBuffer} from './utils';

import sunVertextShaderSource from './shaders/sun.vertex.glsl';
import sunFragmentShaderSource from './shaders/sun.fragment.glsl';
import {Program, BufferObject} from './types';

const {cos, sin, tan, PI} = Math;

interface Context {
    gl: WebGLRenderingContext,
    program: Program,
    sun: BufferObject
}

export function createSun(gl: WebGLRenderingContext) {
    const program = createProgram(
        gl,
        sunVertextShaderSource,
        sunFragmentShaderSource
    )
    const sun = bindArraysToBuffers(gl, {
        arrays: createArrays()
    });
    const context = {gl, sun, program};
    return {
        render: createRender(context)
    }
}

function createRender(context: Context) {
    return function render(opts: {
        cameraPosition: Vec3,
        center: Vec3,
        aspect: number,
        sunPosition: Vec3,
        flip?: boolean
    }) {
        const domeRadius = 1000;
        const {gl, program, sun} = context;
        const {
            cameraPosition,
            center,
            aspect,
            sunPosition,
            flip = false
        } = opts;
        const {projection, model, view} = createMatrices({
            cameraPosition,
            center,
            aspect,
            flip,
            far: domeRadius * 2
        });
        Mat4.translate(model, model, cameraPosition);
        Mat4.scale(model, model, [domeRadius, domeRadius, domeRadius]);

        gl.useProgram(program.program);

        bindBuffer(gl, sun.buffers.position, program.attributes.position, 3);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sun.buffers.indices);

        gl.uniform1f(
            program.uniforms.domeRadius,
            domeRadius
        );

        gl.uniform3fv(
            program.uniforms.sunPosition,
            sunPosition
        );

        gl.uniform3fv(
            program.uniforms.cameraPosition,
            cameraPosition
        );

        gl.uniformMatrix4fv(
            program.uniforms.projection,
            false,
            projection
        );

        gl.uniformMatrix4fv(
            program.uniforms.view,
            false,
            view
        );

        gl.uniformMatrix4fv(
            program.uniforms.model,
            false,
            model
        );

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawElements(gl.TRIANGLES, sun.size, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.BLEND);
    }
}

function createArrays() {
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

const DAY_SPEED = 4e-3;

function pad2(st: string | number) {
    return ('00' + st).slice(-2);
}

export function sunTimeToString(t: number) {
    const minutes = Math.ceil(t / 60 / 1000);
    const m = minutes % 60;
    const h = Math.floor(minutes / 60);
    return `${pad2(h)}:${pad2(m)}`;
}

export function getSunPosition(n: number) {
    const t = n % (24 * 3600 * 1000);
    const altitude = getAltitude(t);
    const azimuth = getAzimuth(t);
    const x = cos(altitude) * cos(azimuth);
    const y = cos(altitude) * sin(azimuth);
    const z = sin(altitude);
    return {
        altitude,
        azimuth,
        sunPosition: Vec3.fromValues(x, -y, z)
    };
}