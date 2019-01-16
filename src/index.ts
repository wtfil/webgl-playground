import {mat4 as Mat4, vec3 as Vec3} from 'gl-matrix';
import vertextShaderSource from './shaders/vertex.glsl';
import fragmentShaderSource from './shaders/fragment.glsl';
import {createTerrain} from './create-terrain';
import {createCube} from './create-cube';

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
    const cubeBuffers = await createBuffers(gl, createCube());
    const terrain = await initTerrain(gl);
    if (!cubeBuffers || !program || !terrain) {
        return;
    }

    const properties = {
        rotation: Mat4.create(),
        translate: Vec3.fromValues(-23.5, -25.6, -79.9),
        directionalLightVector: Vec3.fromValues(0.85, 0.8, 0.75)
    };

    const eventTarget = initControls(canvas);
    eventTarget.addEventListener('change', e => {
        const {detail: {rx, ry, rz, dx, dy, dz, dl}} = e as CustomEvent;
        const {rotation, translate, directionalLightVector} = properties;
        if (rx) {
            Mat4.rotate(rotation, rotation, rx, [1, 0, 0]);
        }
        if (ry) {
            Mat4.rotate(rotation, rotation, ry, [0, 1, 0]);
        }
        if (rz) {
            Mat4.rotate(rotation, rotation, rz, [0, 0, 1]);
        }
        if (dl) {
            Vec3.rotateZ(directionalLightVector, directionalLightVector, [0, 1, 0], 10 * dl);
        }
        Vec3.add(translate, translate, [dx, dy, dz])
    })
    function render() {
        drawScene(program!, cubeBuffers!, properties);
        requestAnimationFrame(render);
    }
    
    render();

}

async function initTerrain(gl: WebGLRenderingContext) {
    const terrain = await createTerrain('/heatmap1.jpg', 32, 16);
    return terrain && createBuffers(gl, terrain);
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
        let dl = 0;

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
        if (pressed['[']) {
            dl = s;
        } else if (pressed[']']) {
            dl = -s;
        }

        if (dx || dy || dz || rx || ry || rz || dl) {
            onChange({dx, dy, dz, rx, ry, rz, dl})
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
        [key: string]: WebGLUniformLocation
    },
    attributes: {
        [key: string]: number;
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
        uDirectionalLightVector: getUniform('uDirectionalLightVector'),
        uTexture: getUniform('uTexture')
    };
    program.attributes = {
        aVertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
        aVertexColor: gl.getAttribLocation(program, 'aVertexColor'),
        aVertexNormal: gl.getAttribLocation(program, 'aVertexNormal'),
        aTextureCoord: gl.getAttribLocation(program, 'aTextureCoord')
    };
    program.gl = gl;

    return program;
}

async function loadTexture(gl: WebGLRenderingContext, url: string) {
    const image: HTMLImageElement = await new Promise((resolve, reject) => {
        const image = new Image();
        image.src = url;
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
    const texture = gl.createTexture();
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const isPowerOf2 = (value: number) => (value & (value - 1)) == 0;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D, level, internalFormat,
        1, 1, 0, srcFormat, srcType,
        new Uint8Array([0, 0, 255, 255])
    );

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, image
    );
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        // No, it's not a power of 2. Turn off mips and set
        // wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    return texture;

}

async function createBuffers(
    gl: WebGLRenderingContext,
    arrays: {
        [key: string]: number[]
    }
) {
    const texture = await loadTexture(gl, '/texture1.png');
    return {
        buffers: {
            position: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.position)),
            color: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.colors)),
            indices: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrays.indices)),
            normal: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.normals)),
            texture: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.texture))
        },
        size: arrays.indices.length
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

function bindBuffer(gl: WebGLRenderingContext, buffer: WebGLBuffer, attribute: number, numComponents: number) {
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
    buffers: {
        buffers: {
            [key: string]: WebGLBuffer
        },
        size: number
    },
    properties: {
        rotation: Mat4,
        translate: Vec3,
        directionalLightVector: Vec3
    }
) {
    const {gl} = program;
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;

    const uPMatrix = Mat4.create();
    const uMVMatrix = Mat4.create();
    const uNMatrix = Mat4.create();

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

    bindBuffer(gl, buffers.buffers.position, program.attributes.aVertexPosition, 3);
    bindBuffer(gl, buffers.buffers.color, program.attributes.aVertexColor, 4);
    //bindBuffer(gl, buffers.buffers.texture, program.attributes.aTextureCoord, 2);
    bindBuffer(gl, buffers.buffers.normal, program.attributes.aVertexNormal, 3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.buffers.indices);
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
    gl.uniform3fv(program.uniforms.uDirectionalLightVector, new Float32Array(properties.directionalLightVector))

    gl.drawElements(gl.TRIANGLES, buffers.size, gl.UNSIGNED_SHORT, 0);
}