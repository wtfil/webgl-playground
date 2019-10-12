import Mat4 = require('gl-matrix/mat4');
import Vec3 = require('gl-matrix/vec3');
import {createProgram, loadTexture, createFramebufferAndTexture, bindArraysToBuffers, createMatrices, bindBuffer} from './utils';
import {Program, BufferObject} from './types';

import waterVertextShaderSource from './shaders/water.vertex.glsl';
import waterFragmentShaderSource from './shaders/water.fragment.glsl';
import {State} from './store';

interface Context {
    gl: WebGLRenderingContext,
    program: Program,
    size: number,
    water: BufferObject
}

export async function createWater(
    gl: WebGLRenderingContext,
    opts: {
        size: number,
    }
) {
    const {size} = opts;
    const dudvTexture = await loadTexture(gl, 'textures/dudvmap.png');
    const normalMapTexture = await loadTexture(gl, 'textures/normalmap.png');
    const [
        refractionTexture,
        refractionFramebuffer
    ] = createFramebufferAndTexture(gl, size, size);
    const [
        reflectionTexture,
        reflectionFramebuffer
    ] = createFramebufferAndTexture(gl, size, size);
    const program = createProgram(
        gl,
        waterVertextShaderSource,
        waterFragmentShaderSource
    );
    const arrays = createArrays();
    const water = bindArraysToBuffers(gl, {
        arrays,
        framebuffers: {
            refraction: refractionFramebuffer,
            reflection: reflectionFramebuffer
        },
        textures: {
            dudv: dudvTexture,
            normalMap: normalMapTexture,
            refraction: refractionTexture,
            reflection: reflectionTexture
        }
    })

    const context = {gl, program, size, water}

    return {
        render: createRender(context),
        updateReflectionTexture: createUpdateReflectionTexture(context),
        updateRefractionTexture: createUpdateRefractionTexture(context)
    }
}

function createUpdateReflectionTexture(context: Context) {
    return function updateReflectionTexture(renderScene: () => void) {
        const {gl, water, size} = context;
        gl.bindFramebuffer(gl.FRAMEBUFFER, water.framebuffers.reflection);
        gl.viewport(0, 0, size, size);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        renderScene();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}

function createUpdateRefractionTexture(context: Context) {
    return function updateRefractionTexture(renderScene: () => void) {
        const {gl, water, size} = context;

        gl.bindFramebuffer(gl.FRAMEBUFFER, water.framebuffers.refraction);
        gl.viewport(0, 0, size, size);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        renderScene();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}

function createRender(context: Context) {

    const {
        size,
        program,
        gl,
        water
    } = context;
    
    gl.useProgram(program.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, water.textures.dudv);
    gl.uniform1i(program.uniforms.dudvTexture, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, water.textures.normalMap);
    gl.uniform1i(program.uniforms.normalMapTexture, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, water.textures.refraction);
    gl.uniform1i(program.uniforms.refractionTexture, 2);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, water.textures.reflection);
    gl.uniform1i(program.uniforms.reflectionTexture, 3);

    return function render(opts: {
        state: State,
        aspect: number,
    }) {
        const {
            state,
            aspect
        } = opts;
        const {projection, model, view} = createMatrices({
            camera: state.camera,
            aspect
        });

        Mat4.scale(model, model, [size, size, 1]);

        gl.useProgram(program.program);
        bindBuffer(gl, water.buffers.position, program.attributes.position, 3);
        bindBuffer(gl, water.buffers.texture, program.attributes.textureCoord, 2);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, water.buffers.indices);

        gl.uniform1f(program.uniforms.dudvOffset, (state.water.time / 1000 * 0.03) % 1);
        gl.uniform1i(program.uniforms.useRefraction, Number(state.water.useRefraction));
        gl.uniform1i(program.uniforms.useReflection, Number(state.water.useReflection));
        gl.uniform3fv(program.uniforms.cameraPosition, state.camera.position);
        gl.uniform3fv(program.uniforms.directionalLightVector, state.light.direction);
        gl.uniform3fv(program.uniforms.directionalLightColor, state.light.color);
        gl.uniformMatrix4fv(
            program.uniforms.projection,
            false,
            projection
        );

        gl.uniformMatrix4fv(
            program.uniforms.model,
            false,
            model
        );

        gl.uniformMatrix4fv(
            program.uniforms.view,
            false,
            view
        );

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawElements(gl.TRIANGLES, water.size, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.BLEND);
    }
}

function createArrays() {
    const position = [
        -0.5, -0.5, 0,
        +0.5, -0.5, 0,
        -0.5, +0.5, 0,
        +0.5, +0.5, 0,
    ];
    const indices = [
        0, 2, 1,
        1, 2, 3
    ];

    const texture = [
        0, 0,
        1, 0,
        0, 1,
        1, 1,
    ];

    return {position, indices, texture};
}