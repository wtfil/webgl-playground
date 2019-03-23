import {Program} from './types';

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) {
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(shader));
        console.warn(source);
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
): Program | null {

    const vertexShader = createShader(gl,  gl.VERTEX_SHADER, vertextShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();

    if (!program || !vertexShader || !fragmentShader) {
        console.warn('Failed to create shader program');
        return null;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn(gl.getProgramInfoLog(program));
        return null;
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

    return {program, uniforms, attributes};
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


const frameBuffers = new Map<number, {texture: WebGLTexture, framebuffer: WebGLFramebuffer}>();

export function createLazyFramebufferAndTexture(gl: WebGLRenderingContext, width: number, height: number, key: number) {
    if (frameBuffers.has(key)) {
        return frameBuffers.get(key)!;
    }
    const texture = gl.createTexture() as WebGLTexture;
    const framebuffer = gl.createFramebuffer() as WebGLFramebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        width, height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
    );


    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    frameBuffers.set(key, {texture, framebuffer})

    return {texture, framebuffer};
}
