import Vec3 = require('gl-matrix/vec3');
import Mat4 = require('gl-matrix/mat4');
import {createProgram, bindArraysToBuffers, createMatrices, bindBuffer, inRange, createFramebufferAndTexture} from './utils';

import vertextShaderSource from './shaders/sky.vertex.glsl';
import fragmentShaderSource from './shaders/sky.fragment.glsl';
import {Program, BufferObject} from './types';
import {State} from './store';

const {cos, sin, tan, PI} = Math;

interface Context {
    gl: WebGLRenderingContext;
    program: Program;
    sun: BufferObject;
    size: number;
}
interface RenderProps {
    state: State;
    aspect: number;
    flip?: boolean;
}

export function createSky(
    gl: WebGLRenderingContext,
    opts: {
        size: number
    }
) {
    const {size} = opts;
    const program = createProgram(
        gl,
        vertextShaderSource,
        fragmentShaderSource
    )
    const [t, f] = createFramebufferAndTexture(gl, size, size);
    const sun = bindArraysToBuffers(gl, {
        arrays: createArrays(),
        textures: {cache: t},
        framebuffers: {cache: f}
    });
    const context = {gl, sun, program, size};
    const render = createRender(context);
    const renderToTexture = createRenderToTexture(context, render);
    return {
        render: renderToTexture
    }
}

function propsSnapshot(props: RenderProps) {
    return JSON.stringify(props.state.camera)
}

function createRenderToTexture(
    context: Context,
    render: ReturnType<typeof createRender>
) {
    const {gl, sun, size} = context;

    let prev: string;
    return function renderToTexture(props: RenderProps) {
        const next = propsSnapshot(props);
        if (next !== prev) {
            prev = next;
            gl.bindFramebuffer(gl.FRAMEBUFFER, sun.framebuffers.cache);
            gl.viewport(0, 0, size, size);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            render(props, false)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
            render(props, true)
        }
    }
}

function createRender(context: Context) {
    const {gl, sun, program} = context;
    gl.useProgram(program.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sun.textures.cache);
    gl.uniform1i(program.uniforms.cacheTexture, 0);

    return function render(props: RenderProps, useCache = false) {
        const {gl, program, sun, size} = context;
        const {
            state,
            aspect,
            flip = false
        } = props;
        const {projection, model, view} = createMatrices({
            camera: state.camera,
            aspect,
            flip,
        });
        const [x, y] = state.camera.position
        Mat4.translate(model, model, [x, y, 0]);
        Mat4.scale(model, model, [size, size, size]);

        gl.useProgram(program.program);

        bindBuffer(gl, sun.buffers.position, program.attributes.position, 3);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sun.buffers.indices);

        gl.uniform1i(
            program.uniforms.useCache,
            Number(useCache)
        );
        gl.uniform3fv(
            program.uniforms.sunPosition,
            state.sky.sunPosition
        );

        gl.uniform3fv(
            program.uniforms.cameraPosition,
            state.camera.position
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

    const sunPosition = Vec3.fromValues(x, -y, z);
    const directionalLightColor = Vec3.fromValues(1, 1, 1);
    const directionalLightVector = Vec3.create();
    const lightAttenuation = inRange(z * 3, 0, 1) // use scattering algorithm for this
    Vec3.negate(directionalLightVector, sunPosition);
    Vec3.scale(directionalLightColor, directionalLightColor, lightAttenuation);

    return {
        sunPosition: Vec3.fromValues(x, -y, z),
        directionalLightColor,
        directionalLightVector
    };
}