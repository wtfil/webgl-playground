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
    const texture = await loadTexture(gl, '/textures/yosemite.png');
    const terrain = await initTerrain(gl, '/heatmaps/yosemite.png', texture);
    // const texture = await loadTexture(gl, '/textures/sognefjorden2.png');
    // const terrain = await initTerrain(gl, '/heatmaps/sognefjorden.png', texture);
    // const texture = await loadTexture(gl, '/textures/texture2.png');
    // const terrain = await initTerrain(gl, '/heatmaps/1.jpg', texture);
    const cube = createBuffers(gl, createCube(), texture);
    if (!cube || !program || !terrain) {
        return;
    }

    const properties = {
        cameraPosition: Vec3.fromValues(0, 0, 200),
        center: Vec3.fromValues(0, 0, 0),
        rotation: 0,
        directionalLightVector: Vec3.fromValues(0, 0, 1)
    };

    const eventTarget = initControls(canvas);
    eventTarget.addEventListener('change', e => {
        const {detail: {rx, ry, rz, dx, dy, dz, dl}} = e as CustomEvent;
        const {center, cameraPosition, directionalLightVector} = properties;
        if (dl) {
            Vec3.rotateZ(directionalLightVector, directionalLightVector, [0, 1, 0], 10 * dl);
            Vec3.rotateZ(directionalLightVector, directionalLightVector, [0, 0, 1], 10 * dl);
        }
        Vec3.add(cameraPosition, cameraPosition, [rx + dx, ry + dy, rz + dz]);
        Vec3.add(center, center, [dx, dy, dz]);
    })
    function render() {
        properties.rotation += 0.005;
        drawScene(program!, properties, [
            terrain!,
            // cube!
        ])
        requestAnimationFrame(render);
    }
    
    render();

}

async function initTerrain(gl: WebGLRenderingContext, heatmapSrc: string, texture: WebGLTexture) {
    const terrain = await createTerrain(heatmapSrc, 16, 15);
    return terrain && createBuffers(gl, terrain, texture);
}

function initControls(canvas: HTMLElement) {
    const ee = new EventTarget();
    const s = 400 / Math.hypot(canvas.clientHeight, canvas.clientWidth);
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
            dy = s;
        } else if (pressed.s) {
            dy = -s;
        }

        if (pressed.e) {
            dz = s
        } else if (pressed.q) {
            dz = -s
        }

        if (pressed.a) {
            dx = -s;
        } else if (pressed.d) {
            dx = s;
        }

        if (pressed.j) {
            ry = -s * 3;
        } else if (pressed.k) {
            ry = s * 3;
        }
        if (pressed.h) {
            rx = -s * 3;
        } else if (pressed.l) {
            rx = s * 3;
        }
        if (pressed['[']) {
            dl = s / 400;
        } else if (pressed[']']) {
            dl = -s / 400;
        }

        if (dx || dy || dz || rx || ry || rz || dl) {
            onChange({dx, dy, dz, rx, ry, rz, dl})
        }
        requestAnimationFrame(pullKeys);
    }
    pullKeys();

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
    gl.generateMipmap(gl.TEXTURE_2D);

    return texture as WebGLTexture;

}

function createBuffers(
    gl: WebGLRenderingContext,
    arrays: {
        [key: string]: number[]
    },
    texture: WebGLTexture
) {
    return {
        buffers: {
            position: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.position)),
            color: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.colors)),
            indices: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrays.indices)),
            normal: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.normals)),
            texture: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.texture))
        },
        texture,
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
    properties: {
        rotation: number,
        cameraPosition: Vec3,
        center: Vec3,
        directionalLightVector: Vec3
    },
    objects: Array<{
        buffers: {
            [key: string]: WebGLBuffer
        },
        size: number,
        texture: WebGLTexture
    }>,
) {
    const {gl} = program;
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;

    const uPMatrix = Mat4.create();
    const uMVMatrix = Mat4.create();
    const uNMatrix = Mat4.create();

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(135 / 256, 206 / 256, 235 / 256, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fovy = 45 * Math.PI / 180;
    const ratio = width / height;
    Mat4.perspective(uPMatrix, fovy, ratio, 0.1, 1000.0);

    Mat4.lookAt(uMVMatrix, properties.cameraPosition, properties.center, [0, 1, 0]);

    Mat4.invert(uNMatrix, uMVMatrix);
    Mat4.transpose(uNMatrix, uNMatrix)

    gl.useProgram(program);

    for (let i = 0; i < objects.length; i ++) {
        const buffers = objects[i];

        // Assuming that object has square size
        const width = Math.sqrt(buffers.size / 6);
        Mat4.translate(uMVMatrix, uMVMatrix, [-width / 2, -width / 2, 0]);

        bindBuffer(gl, buffers.buffers.position, program.attributes.aVertexPosition, 3);
        bindBuffer(gl, buffers.buffers.color, program.attributes.aVertexColor, 4);
        bindBuffer(gl, buffers.buffers.texture, program.attributes.aTextureCoord, 2);
        bindBuffer(gl, buffers.buffers.normal, program.attributes.aVertexNormal, 3);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.buffers.indices);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, buffers.texture);

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
        gl.uniform1i(program.uniforms.uTexture, 0);

        gl.drawElements(gl.TRIANGLES, buffers.size, gl.UNSIGNED_SHORT, 0);
    }

}