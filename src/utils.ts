import Mat4 = require('gl-matrix/mat4');
import Vec3 = require('gl-matrix/vec3');
import {Program, BufferObject} from './types';
import {State} from './store';

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) {
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(source);
        console.warn(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}


export async function loadTexture(gl: WebGLRenderingContext, url: string) {
    const image: HTMLImageElement = await new Promise((resolve, reject) => {
        const image = new Image();
        image.src = url;
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
    const texture = gl.createTexture();
    const isPow2 = (n: number) => (n & (n - 1)) === 0;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 255, 255])
    );

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        gl.RGBA, gl.UNSIGNED_BYTE, image
    );

    if (isPow2(image.width) && isPow2(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    return texture as WebGLTexture;

}

export function createProgram(
    gl: WebGLRenderingContext,
    vertextShaderSource: string,
    fragmentShaderSource: string,
): Program {

    const vertexShader = createShader(gl,  gl.VERTEX_SHADER, vertextShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();

    if (!program || !vertexShader || !fragmentShader) {
        throw new Error('Failed to create shader program');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn(gl.getProgramInfoLog(program));
        throw new Error('Can not creat program');
    }
    const attributes: Program['attributes'] = {};
    const uniforms: Program['uniforms'] = {};
    const attributesCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    const uniformsCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

    for (let i = 0; i < attributesCount; i ++) {
        const name = gl.getActiveAttrib(program, i)!.name;
        attributes[name] = gl.getAttribLocation(program, name);
    }
    for (let i = 0; i < uniformsCount; i ++) {
        const name = gl.getActiveUniform(program, i)!.name;
        uniforms[name] = gl.getUniformLocation(program, name) as WebGLUniformLocation;
    }

    return {program, uniforms, attributes, gl};
}

export function createMatrices(opts: {
    camera: State['camera'],
    aspect: number,
    flip?: boolean,
    far?: number
}) {
    const projection = Mat4.create();
    const view = Mat4.create();
    const model = Mat4.create();
    Mat4.perspective(
        projection,
        Math.PI / 4,
        opts.aspect,
        0.1,
        opts.far || 2000
    );

    const camera = Vec3.clone(opts.camera.position);
    const center = Vec3.clone(opts.camera.center);
    if (opts.flip) {
        center[2] = -center[2];
        camera[2] = -camera[2];
    }

    Mat4.lookAt(view, camera, center, [0, 0, 1]);

    return {model, projection, view};
}

export function createBuffer(gl: WebGLRenderingContext, type: number, data: Float32Array | Uint16Array) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(
        type,
        data,
        gl.STATIC_DRAW
    );
    return buffer as WebGLBuffer;
}

export function bindBuffer(gl: WebGLRenderingContext, buffer: WebGLBuffer, attribute: number, numComponents: number) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(
        attribute,
        numComponents,
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(attribute);
}

export function bindArraysToBuffers(
    gl: WebGLRenderingContext,
    opts: {
        arrays: {
            [key: string]: number[]
        },
        textures?: BufferObject['textures'],
        framebuffers?: BufferObject['framebuffers']
    }
): BufferObject {
    const {arrays, textures = {}, framebuffers = {}} = opts;
    return {
        buffers: {
            position: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.position)),
            colors: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.colors)),
            indices: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrays.indices)),
            normal: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.normals)),
            texture: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.texture))
        },
        textures,
        framebuffers,
        size: arrays.indices.length
    }
}



export function createFramebufferAndTexture(gl: WebGLRenderingContext, width: number, height: number) {
    const ext = gl.getExtension('WEBGL_depth_texture');
    if (!ext) {
        console.warn('WEBGL_depth_texture is not supported')
    }
    const colorTexture = gl.createTexture() as WebGLTexture;
    const depthTexture = gl.createTexture() as WebGLTexture;
    const framebuffer = gl.createFramebuffer() as WebGLFramebuffer;
    // const renderbuffer = gl.createRenderbuffer() as WebGLRenderbuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        width, height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT,
        width, height, 0,
        gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);


    // gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    // gl.renderbufferStorage(
    //     gl.RENDERBUFFER,
    //     gl.DEPTH_COMPONENT16,
    //     width, height
    // );

    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        colorTexture,
        0
    );
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.TEXTURE_2D,
        depthTexture,
        0
    );
    // gl.framebufferRenderbuffer(
    //     gl.FRAMEBUFFER,
    //     gl.DEPTH_ATTACHMENT,
    //     gl.RENDERBUFFER,
    //     renderbuffer,
    // ); 
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {colorTexture, depthTexture, framebuffer};
}


export function inRange(v: number, min: number, max: number): number {
    if (v < min) {
        return min;
    } else if (v > max) {
        return max;
    }
    return v;
}


export const toggleViaQS = (term: string, defaultValue: boolean) => {
    return window.location.search.includes(term) ? !defaultValue: defaultValue;
}
