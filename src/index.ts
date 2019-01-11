import {mat4 as Mat4} from 'gl-matrix';
import vertextShaderSource from './shaders/vertex.glsl';
import fragmentShaderSource from './shaders/fragment.glsl';

window.addEventListener('load', setup);

function setup() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const gl = canvas.getContext('experimental-webgl');
    if (!gl) {
        return;
    }
    document.body.appendChild(canvas);

    const program = createProgram(gl);
    const buffers = createBuffers(gl);
    if (!buffers || !program) {
        return;
    }

    const start = Date.now();
    function render() {
        drawScene(program!, buffers, Date.now() - start);
        requestAnimationFrame(render);
    }

    render();

}

function createShader(source: string, gl: WebGLRenderingContext, type: number) {
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
        uNMatrix: WebGLUniformLocation;
    },
    attributes: {
        aVertexPosition: number;
        aVertexColor: number;
        aVertexNormal: number;
    },
    gl: WebGLRenderingContext;
}
function createProgram(gl: WebGLRenderingContext): Program | null {

    const vertexShader = createShader(vertextShaderSource, gl, gl.VERTEX_SHADER);
    const fragmentShader = createShader(fragmentShaderSource, gl, gl.FRAGMENT_SHADER);
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
        uPMatrix: getUniform('uPMatrix'),
        uNMatrix: getUniform('uNMatrix')
    };
    program.attributes = {
        aVertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
        aVertexColor: gl.getAttribLocation(program, 'aVertexColor'),
        aVertexNormal: gl.getAttribLocation(program, 'aVertexNormal')
    };
    program.gl = gl;

    return program;
}

function createBuffers(gl: WebGLRenderingContext) {
    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];
    const faceColors = [
        [1.0, 1.0, 1.0, 1.0],    // Front face: white
        [1.0, 0.0, 0.0, 1.0],    // Back face: red
        [0.0, 1.0, 0.0, 1.0],    // Top face: green
        [0.0, 0.0, 1.0, 1.0],    // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0],    // Right face: yellow
        [1.0, 0.0, 1.0, 1.0],    // Left face: purple
    ];

    let colors: number[] = [];

    for (var j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        colors = colors.concat(c, c, c, c);
    }

    const vertexNormals = [
        // Front
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,

        // Back
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,

        // Top
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,

        // Bottom
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,

        // Right
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,

        // Left
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ];

    const indices = [
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // back
        8, 9, 10, 8, 10, 11,   // top
        12, 13, 14, 12, 14, 15,   // bottom
        16, 17, 18, 16, 18, 19,   // right
        20, 21, 22, 20, 22, 23,   // left
    ];

    return {
        position: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(positions)),
        color: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(colors)),
        indices: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices)),
        normal: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(vertexNormals))
    }
}

function createBuffer(gl: WebGLRenderingContext, type: number, data: Float32Array | Uint16Array) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(
        type,
        data,
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

function drawScene(program: Program, buffers: {[key: string]: WebGLBuffer}, dt: number) {
    const {gl} = program;
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;

    const uPMatrix = Mat4.create();
    const uMVMatrix = Mat4.create();
    const uNMatrix = Mat4.create();
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fovy = 45 * Math.PI / 180;
    const ratio = width / height;
    const rotation = dt / 7 / 180;
    Mat4.perspective(uPMatrix, fovy, ratio, 0.1, 100.0);
    Mat4.translate(uMVMatrix, uMVMatrix, [-0.0, 0.0, -6.0]);
    Mat4.rotate(uMVMatrix, uMVMatrix, rotation, [0, 1, 1])

    Mat4.invert(uNMatrix, uMVMatrix);
    Mat4.transpose(uNMatrix, uNMatrix);

    sendBuffer(gl, buffers.position, program.attributes.aVertexPosition, 3);
    sendBuffer(gl, buffers.color, program.attributes.aVertexColor, 4);
    sendBuffer(gl, buffers.normal, program.attributes.aVertexNormal, 3);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    gl.useProgram(program);
    gl.uniformMatrix4fv(
        program.uniforms.uNMatrix,
        false,
        uNMatrix
    );
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

    gl.drawElements(gl.TRIANGLE_STRIP, 36, gl.UNSIGNED_SHORT, 0);

}