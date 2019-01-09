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
    const buffer = createBuffer(gl);
    if (!buffer || !program) {
        return;
    }

    drawScene(program, buffer);
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
    },
    matrix: {
        uPMatrix: Mat4,
        uMVMatrix: Mat4
    },
    gl: WebGLRenderingContext;
}
async function createProgram(gl: WebGLRenderingContext): Promise<Program | null> {

    const webglProgram = gl.createProgram();
    const uPMatrix = Mat4.create();
    const uMVMatrix = Mat4.create();
    const vertexShader = await loadShader('vertex.glsl', gl, gl.VERTEX_SHADER);
    const fragmentShader = await loadShader('fragment.glsl', gl, gl.FRAGMENT_SHADER);

    if (!webglProgram || !vertexShader || !fragmentShader) {
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
        aVertexPosition: gl.getAttribLocation(program, 'aVertexPosition')
    };
    program.matrix = {uPMatrix, uMVMatrix}
    program.gl = gl;

    return program;
}

function createBuffer(gl: WebGLRenderingContext) {
    const buffer = gl.createBuffer();
    const positions = [
        -1.0, 1.0,
        1.0, 1.0,
        -1.0, -1.0,
        1.0, -1.0,
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW
    );
    return buffer;
}

function drawScene(program: Program, buffer: WebGLBuffer) {
    const {gl, matrix: {uPMatrix, uMVMatrix}} = program;
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;
    
    //gl.viewport(0, 0, width, height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fovy = 45 * Math.PI / 180;
    Mat4.perspective(uPMatrix, fovy, width / height, 0.1, 100.0);
    Mat4.translate(uMVMatrix, uMVMatrix, [-0.0, 0.0, -6.0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(
        program.attributes.aVertexPosition,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(program.attributes.aVertexPosition);

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