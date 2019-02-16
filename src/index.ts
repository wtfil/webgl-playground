import {mat4 as Mat4, vec3 as Vec3} from 'gl-matrix';
import terrainVertextShaderSource from './shaders/terrain.vertex.glsl';
import terrainFragmentShaderSource from './shaders/terrain.fragment.glsl';
import waterVertextShaderSource from './shaders/water.vertex.glsl';
import waterFragmentShaderSource from './shaders/water.fragment.glsl';
import {createTerrain} from './create-terrain';
import {initControls} from './init-contol';
import {createWater} from './create-water';
import {ProgramProperties, BufferObject, Program} from './types';

window.addEventListener('load', setup);

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 512;

async function setup() {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const gl = canvas.getContext('experimental-webgl');
    if (!gl) {
        return;
    }
    document.body.appendChild(canvas);

    const terrainProgram = createProgram(
        gl,
        terrainVertextShaderSource,
        terrainFragmentShaderSource
    );
    const waterProgram = createProgram(
        gl,
        waterVertextShaderSource,
        waterFragmentShaderSource
    );
    const terrainTexture = await loadTexture(gl, '/textures/yosemite.png');
    const terrain = await initTerrain(gl, '/heatmaps/yosemite.png', terrainTexture);
    const dudvTexture = await loadTexture(gl, '/textures/dudvmap.png');
    const water = createBuffers(gl, createWater(CANVAS_WIDTH, CANVAS_HEIGHT), dudvTexture);
    // const texture = await loadTexture(gl, '/textures/sognefjorden2.png');
    // const terrain = await initTerrain(gl, '/heatmaps/sognefjorden.png', texture);
    // const texture = await loadTexture(gl, '/textures/texture2.png');
    // const terrain = await initTerrain(gl, '/heatmaps/1.jpg', texture);
    // const cube = createBuffers(gl, createCube(), texture);
    if (!water || !waterProgram || !terrainProgram || !terrain) {
        return;
    }

    const properties: ProgramProperties = {
        cameraPosition: Vec3.fromValues(0, 0, 200),
        center: Vec3.fromValues(0, 0, 0),
        rotation: 0,
        directionalLightVector: Vec3.fromValues(0, 0, 1),
        start: Date.now(),
        time: 0,
        renderWater: true,
        renderTerrain: true
    };

    const eventTarget = initControls(canvas);
    eventTarget.addEventListener('change', e => {
        const {detail: {toggleRenderTerrain, toggleRenderWater, rx, ry, rz, dx, dy, dz, dl}} = e as CustomEvent;
        const {center, cameraPosition, directionalLightVector} = properties;
        if (toggleRenderWater) {
            properties.renderWater = !properties.renderWater;
            return;
        }
        if (toggleRenderTerrain) {
            properties.renderTerrain = !properties.renderTerrain;
            return;
        }
        if (dl) {
            Vec3.rotateZ(directionalLightVector, directionalLightVector, [0, 1, 1], 10 * dl);
        }
        // Vec3.add(center, center, [dx, dy, dz]);
        Vec3.add(cameraPosition, cameraPosition, [dx, dy, dz]);

        const cameraVector = Vec3.create();
        Vec3.negate(cameraVector, center);
        Vec3.add(cameraVector, cameraVector, cameraPosition);
        Vec3.rotateX(cameraVector, cameraVector, [0, 0, 0], rx / 30)
        Vec3.rotateY(cameraVector, cameraVector, [0, 0, 0], ry / 100)
        Vec3.add(cameraPosition, cameraVector, center);
    })
    function render() {
        properties.time = Date.now() - properties.start;
        drawScene({
            gl: gl!,
            terrainProgram: terrainProgram!,
            waterProgram: waterProgram!,
            properties,
            terrain: terrain!,
            water: water!
        });
        requestAnimationFrame(render);
    }
    
    render();
}

async function initTerrain(gl: WebGLRenderingContext, heatmapSrc: string, texture: WebGLTexture) {
    const terrain = await createTerrain(heatmapSrc, 30, 5);
    return terrain && createBuffers(gl, terrain, texture);
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


function createProgram(
    gl: WebGLRenderingContext,
    vertextShaderSource: string,
    fragmentShaderSource: string,
    // uniformNames: string[],
    // attributeNames: string[]
): Program | null {

    const vertexShader = createShader(gl,  gl.VERTEX_SHADER, vertextShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const webglProgram = gl.createProgram();

    if (!webglProgram || !vertexShader || !fragmentShader) {
        console.warn('Failed to create shader program');
        return null;
    }

    const program = webglProgram as Program;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn(gl.getProgramInfoLog(program));
        return null;
    }
    const attributeRE = /^attribute.*\s(.+);$/;
    const uniformRE = /^uniform.*\s(.+);$/;
    program.attributes = {};
    program.uniforms = {};

    [vertextShaderSource, fragmentShaderSource].join('\n').split('\n').forEach(line => {
        const am = line.trim().match(attributeRE);
        const um = line.trim().match(uniformRE);
        if (am) {
            const name = am[1];
            program.attributes[name] = gl.getAttribLocation(program, name);
        }
        if (um) {
            const name = um[1];
            program.uniforms[name] = gl.getUniformLocation(program, name) as WebGLUniformLocation;
        }
    })

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

function createBuffers(
    gl: WebGLRenderingContext,
    arrays: {
        [key: string]: number[]
    },
    texture: WebGLTexture
): BufferObject {
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

function prepareScene(gl: WebGLRenderingContext, properties: ProgramProperties) {
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;

    const projection = Mat4.create();
    const model = Mat4.create();

    gl.viewport(0, 0, width, height);
    gl.clearColor(135 / 256, 206 / 256, 235 / 256, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    Mat4.perspective(projection, 45 * Math.PI / 180, width / height, 0.1, 1000.0);

    Mat4.lookAt(model, properties.cameraPosition, properties.center, [0, 1, 0]);

    return {model, projection}
}

function createRefraction(gl: WebGLRenderingContext, width: number, height: number) {
    const refractionTexture = gl.createTexture() as WebGLTexture;
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    gl.bindTexture(gl.TEXTURE_2D, refractionTexture);
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
        refractionTexture,
        0
    );


    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {refractionTexture, framebuffer};
}

function drawScene(props: {
    gl: WebGLRenderingContext,
    terrainProgram: Program,
    waterProgram: Program,
    properties: ProgramProperties,
    terrain: BufferObject,
    water: BufferObject
}) {
    
    let {gl, terrainProgram, waterProgram, properties, terrain, water} = props;
    const waterHeight = 4;
    const {model, projection} = prepareScene(gl, properties);
    let refractionTexture: WebGLTexture;

    const renderTerrain = (clipLevel: -1 | 1 | 0) => {
        gl.useProgram(terrainProgram);
        bindBuffer(gl, terrain.buffers.position, terrainProgram.attributes.position, 3);
        bindBuffer(gl, terrain.buffers.texture, terrainProgram.attributes.textureCoord, 2);
        bindBuffer(gl, terrain.buffers.normal, terrainProgram.attributes.normal, 3);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrain.buffers.indices);

        gl.uniformMatrix4fv(
            terrainProgram.uniforms.projection,
            false,
            projection
        );
        gl.uniformMatrix4fv(
            terrainProgram.uniforms.model,
            false,
            model
        );

        gl.uniform3fv(terrainProgram.uniforms.directionalLightVector, new Float32Array(properties.directionalLightVector));
        gl.uniform1f(terrainProgram.uniforms.clipZ, waterHeight);
        gl.uniform1f(terrainProgram.uniforms.clipLevel, clipLevel);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, terrain.texture);
        gl.uniform1i(terrainProgram.uniforms.texture, 0);

        gl.drawElements(gl.TRIANGLES, terrain.size, gl.UNSIGNED_SHORT, 0);
    }

    const getRefractTexture = () => {
        // const width = CANVAS_WIDTH;
        // const height = CANVAS_HEIGHT;
        const width = 216;
        const height = 216;
        // const distance = Vec3.distance(properties.center, properties.cameraPosition);
        // const originalFovy = 45 / 180 * Math.PI
        // const fovy = Math.atan(width / 2 / distance) * 2;

        // Mat4.perspective(projection, fovy, width / height, 0.1, 1000.0);
        const {framebuffer, refractionTexture} = createRefraction(gl, width, height);
        water = createBuffers(gl, createWater(width, height), water.texture);

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, width, height);
        // gl.clearColor(0.53, 0.8, 0.98, 1);
        gl.clearColor(0, 0, 0, 1);
        // gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        renderTerrain(1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Mat4.perspective(projection, originalFovy, width / height, 0.1, 1000.0);

        return refractionTexture;
    }

    const renderWater = () => {
        Mat4.translate(model, model, [0, 0, waterHeight]);
        gl.useProgram(waterProgram);
        bindBuffer(gl, water.buffers.position, waterProgram.attributes.position, 3);
        bindBuffer(gl, water.buffers.texture, waterProgram.attributes.textureCoord, 2);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, water.buffers.indices);

        gl.uniform1f(waterProgram.uniforms.dudvOffset, (properties.time / 1000 / 20) % 1);
        gl.uniformMatrix4fv(
            waterProgram.uniforms.projection,
            false,
            projection
        );
        gl.uniformMatrix4fv(
            waterProgram.uniforms.model,
            false,
            model
        );
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, water.texture);
        gl.uniform1i(waterProgram.uniforms.dudvTexture, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, refractionTexture);
        gl.uniform1i(waterProgram.uniforms.refractionTexture, 0);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawElements(gl.TRIANGLES, water.size, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.BLEND);
    }

    if (properties.renderWater) {
        refractionTexture = getRefractTexture();
    }
    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
    
    if (properties.renderTerrain) {
        renderTerrain(0);
    }

    if (properties.renderWater) {
        renderWater();
    }

}