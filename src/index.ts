import {mat4 as Mat4, vec3 as Vec3} from 'gl-matrix';
import vertextShaderSource from './shaders/vertex.glsl';
import fragmentShaderSource from './shaders/fragment.glsl';
import {createTerrain} from './create-terrain';

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

    const program = createProgram(gl, vertextShaderSource, fragmentShaderSource);
    const buffers = createBuffers(gl);
    const terrain = await initTerrain(gl);
    if (!buffers || !program || !terrain) {
        return;
    }

    const properties = {
        rotation: Mat4.create(),
        translate: Vec3.fromValues(-5, -5, -20)
    };

    const eventTarget = initControls(canvas);
    eventTarget.addEventListener('change', e => {
        const {detail: {rx, ry, rz, dx, dy, dz}} = e as CustomEvent;
        const {rotation, translate} = properties;
        if (rx) {
            Mat4.rotate(rotation, rotation, rx, [1, 0, 0]);
        }
        if (ry) {
            Mat4.rotate(rotation, rotation, ry, [0, 1, 0]);
        }
        if (rz) {
            Mat4.rotate(rotation, rotation, rz, [0, 0, 1]);
        }
        Vec3.add(translate, translate, [dx, dy, dz])
    })
    function render() {
        drawScene(program!, terrain!, properties);
        requestAnimationFrame(render);
    }
    
    render();

}

async function initTerrain(gl: WebGLRenderingContext) {
    const terrain = await createTerrain('/heatmap1.jpg', 32, 16);
    if (!terrain) {
        return terrain;
    }
    return {
        position: createBuffer(gl, gl.ARRAY_BUFFER, terrain.position),
        color: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(terrain.colors)),
        indices: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, terrain.indices),
        // normal: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(vertexNormals))
        size: terrain.indices.length
    }
}

function initControls(canvas: HTMLElement) {
    let mouseDown = false;
    const ee = new EventTarget();
    const s = 1 / Math.hypot(canvas.clientHeight, canvas.clientWidth);
    const s1 = 100 * s;
    const s2 = 15 * s;
    const pressed: {[key: string]: boolean} = {};
    const onChange = (detail: any) => {
        ee.dispatchEvent(new CustomEvent('change', {detail}))
    }
    const pullKeys = () => {
        let dx = 0;
        let dy = 0;
        let dz = 0;
        let rx = 0;
        let ry = 0;
        let rz = 0;

        if (pressed.w) {
            dz = s1;
        } else if (pressed.s) {
            dz = -s1;
        }

        if (pressed.e) {
            dy = -s1
        } else if (pressed.q) {
            dy = s1
        }

        if (pressed.a) {
            dx = s1;
        } else if (pressed.d) {
            dx = -s1;
        }

        if (pressed.j) {
            rx = s2;
        } else if (pressed.k) {
            rx = -s2;
        }
        if (pressed.h) {
            ry = s2;
        } else if (pressed.l) {
            ry = -s2;
        }

        if (dx || dy || dz || rx || ry || rz) {
            onChange({dx, dy, dz, rx, ry, rz})
        }
        requestAnimationFrame(pullKeys);
    }
    pullKeys();

    /*
    canvas.addEventListener('mousedown', () => {
        mouseDown = true;
    });
    window.addEventListener('mouseup', () => {
        mouseDown = false;
    });
    canvas.addEventListener('mousemove', e => {
        if (!mouseDown) {
            return;
        }
        const rx = e.movementX / canvas.clientWidth;
        const ry = e.movementY / canvas.clientHeight;
        onChange({rx, ry});
    });
    */
    window.addEventListener('keypress', e => {
        pressed[e.key] = true;
    })
    window.addEventListener('keyup', e => {
        pressed[e.key] = false;
    })
    return ee;
}

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
function createProgram(
    gl: WebGLRenderingContext,
    vertextShaderSource: string,
    fragmentShaderSource: string
): Program | null{

    const vertexShader = createShader(gl,  gl.VERTEX_SHADER, vertextShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
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
        uNMatrix: getUniform('uNMatrix'),
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

function drawScene(
    program: Program,
    buffers: {[key: string]: WebGLBuffer | number},
    properties: {
        rotation: Mat4,
        translate: Vec3
    }
) {
    const {gl} = program;
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;

    const uPMatrix = Mat4.create();
    const uMVMatrix = Mat4.create();
    const uNMatrix = Mat4.create();

    function drawBuffer() {
        sendBuffer(gl, buffers.position, program.attributes.aVertexPosition, 3);
        sendBuffer(gl, buffers.color, program.attributes.aVertexColor, 4);
        //sendBuffer(gl, buffers.normal, program.attributes.aVertexNormal, 3);
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

        //gl.drawElements(gl.TRIANGLE_STRIP, 108748, gl.UNSIGNED_SHORT, 0);
        //gl.drawElements(gl.LINE_STRIP, 108748 / 3, gl.UNSIGNED_SHORT, 0);
        gl.drawElements(gl.LINE_STRIP, buffers.size as number, gl.UNSIGNED_SHORT, 0);
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fovy = 45 * Math.PI / 180;
    const ratio = width / height;
    Mat4.perspective(uPMatrix, fovy, ratio, 0.1, 1000.0);
    Mat4.translate(uMVMatrix, uMVMatrix, properties.translate);
    Mat4.mul(uMVMatrix, uMVMatrix, properties.rotation);

    Mat4.invert(uNMatrix, uMVMatrix);
    Mat4.transpose(uNMatrix, uNMatrix);

    drawBuffer();

    // Mat4.translate(uMVMatrix, uMVMatrix, [-0.0, 0.0, -6.0]);
    // drawCube();

}