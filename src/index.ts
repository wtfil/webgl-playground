import {mat4 as Mat4} from 'gl-matrix';

window.addEventListener('load', setup);

async function setup() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const gl = canvas.getContext('experimental-webgl');
    if (!gl) {
        return;
    }
    document.body.appendChild(canvas);

    const program = await createProgram(gl);
    const buffers = createBuffers(gl);
    if (!buffers || !program) {
        return;
    }

    drawScene(program, buffers);
}

async function loadShader(url: string, gl: WebGLRenderingContext, type: number) {
    const res = await fetch('/shaders/' + url);
    const source = await res.text();
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


export type Program = WebGLProgram & {
    uniforms: {
        uMVMatrix: WebGLUniformLocation;
        uPMatrix: WebGLUniformLocation;
    },
    attributes: {
        aVertexPosition: number;
        aVertexColor: number;
    },
    matrix: {
        uPMatrix: Mat4,
        uMVMatrix: Mat4
    },
    gl: WebGLRenderingContext;
}
async function createProgram(gl: WebGLRenderingContext): Promise<Program | null> {

    const uPMatrix = Mat4.create();
    const uMVMatrix = Mat4.create();
    const vertexShader = await loadShader('vertex.glsl', gl, gl.VERTEX_SHADER);
    const fragmentShader = await loadShader('fragment.glsl', gl, gl.FRAGMENT_SHADER);
    const webglProgram = gl.createProgram();

    if (!webglProgram || !vertexShader || !fragmentShader) {
        console.warn('Failed to create shader program');
        return null;
    }

    const program = webglProgram as Program;
    const getUniform = (name: string) => {
        return gl.getUniformLocation(program, name) as WebGLUniformLocation;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn(gl.getProgramInfoLog(program));
        return null;
    }

    program.uniforms = {
        uMVMatrix: getUniform('uMVMatrix'),
        uPMatrix: getUniform('uPMatrix')
    };
    program.attributes = {
        aVertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
        aVertexColor: gl.getAttribLocation(program, 'aVertexColor')
    };
    program.matrix = {uPMatrix, uMVMatrix}
    program.gl = gl;

    return program;
}

function createBuffers(gl: WebGLRenderingContext) {
    const positions = [
         1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
        -1.0, -1.0,
    ];
    const colors = [
        1.0,  1.0,  1.0,  1.0,
        1.0,  0.0,  0.0,  1.0,
        0.0,  1.0,  0.0,  1.0,
        0.0,  0.0,  1.0,  1.0,
    ];
    return {
        position: createBuffer(gl, positions),
        color: createBuffer(gl, colors)
    }
}

function createBuffer(gl: WebGLRenderingContext, data: number[]) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(data),
        gl.STATIC_DRAW
    );
    return buffer as WebGLBuffer;
}

function sendBuffer(gl: WebGLRenderingContext, buffer: WebGLBuffer, attribute: number, numComponents: number) {
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

function drawScene(program: Program, buffers: {[key: string]: WebGLBuffer}) {
    const {gl, matrix: {uPMatrix, uMVMatrix}} = program;
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fovy = 45 * Math.PI / 180;
    const ratio = width / height;
    Mat4.perspective(uPMatrix, fovy, ratio, 0.1, 100.0);
    Mat4.translate(uMVMatrix, uMVMatrix, [-0.0, 0.0, -6.0]);

    sendBuffer(gl, buffers.position, program.attributes.aVertexPosition, 2);
    sendBuffer(gl, buffers.color, program.attributes.aVertexColor, 4);

    gl.useProgram(program);
    gl.uniformMatrix4fv(
        program.uniforms.uPMatrix,
        false,
        uPMatrix
    );
    gl.uniformMatrix4fv(
        program.uniforms.uMVMatrix,
        false,
        uMVMatrix
    );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

}