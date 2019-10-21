// @see http://learnwebgl.brown37.net/11_advanced_rendering/shadows.html

import {createProgram, bindArraysToBuffers} from './utils';

import {Program, BufferObject} from './types';

import vertextShaderSource from './shaders/shadow.vertex.glsl';
import fragmentShaderSource from './shaders/shadow.fragment.glsl';

interface Context {
    gl: WebGLRenderingContext;
    size: number;
    program: Program;
    shadow: BufferObject;
}

export function createLight(
    gl: WebGLRenderingContext,
    opts: {
        size: number
    }
) {
    const {framebuffer, depthTexture} = createFramebuffer(gl, opts.size);
    const program = createProgram(
        gl,
        vertextShaderSource,
        fragmentShaderSource
    );
    const shadow = bindArraysToBuffers(gl, {
        framebuffers: {shadow: framebuffer},
        textures: {depth: depthTexture}
    })
    const context = {gl, program, shadow, size: opts.size}
    return {
        depthTexture,
        updateDepthTexture: createUpdateDepthTexture(context)
    }
}

function createUpdateDepthTexture (context: Context) {
    return function (renderScene: () => void) {
        const {gl, shadow, size} = context;
        gl.bindFramebuffer(gl.FRAMEBUFFER, shadow.framebuffers.shadow);
        gl.viewport(0, 0, size, size);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        renderScene();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}

const createFramebuffer = (gl: WebGLRenderingContext, size: number) => {
    const framebuffer = gl.createFramebuffer() as WebGLFramebuffer;
    // const colorTexture = gl.createTexture() as WebGLTexture;
    const colorTexture = null;
    const depthTexture = gl.createTexture() as WebGLRenderbuffer;
    const result = {framebuffer, depthTexture, colorTexture}
    if (!gl.getExtension('WEBGL_depth_texture')) {
        console.warn('WEBGL_depth_texture is not supported')
        return result;
    }
    console.log(size)
    // gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    // gl.texImage2D(
    //     gl.TEXTURE_2D, 0, gl.RGBA,
    //     size, size, 0,
    //     gl.RGBA, gl.UNSIGNED_BYTE, null
    // );
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT,
        size, size, 0,
        gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    // gl.framebufferTexture2D(
    //     gl.FRAMEBUFFER,
    //     gl.COLOR_ATTACHMENT0,
    //     gl.TEXTURE_2D,
    //     colorTexture,
    //     0
    // );
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.TEXTURE_2D,
        depthTexture,
        0
    );
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.warn(`Can not create framebuffer\n${status}`);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return result;
}
