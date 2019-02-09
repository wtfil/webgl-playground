import {mat4 as Mat4, vec3 as Vec3} from 'gl-matrix';
import vertextShaderSource from './shaders/vertex.glsl';
import fragmentShaderSource from './shaders/fragment.glsl';
import {createTerrain} from './create-terrain';
import {initControls} from './init-contol';
import {createWater} from './create-water';
import {ProgramProperties, BufferObject, Program} from './types';

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

    const terrainProgram = createProgram(
        gl,
        vertextShaderSource,
        fragmentShaderSource,
        [
            'model',
            'projection',
            'directionalLightVector',
            'texture'
        ],
        [
            'position',
            'color',
            'normal',
            'textureCoord'
        ]
    );
    const terrainTexture = await loadTexture(gl, '/textures/yosemite.png');
    const terrain = await initTerrain(gl, '/heatmaps/yosemite.png', terrainTexture);
    const waterTexture = await loadTexture(gl, '/textures/water.png');
    const water = createBuffers(gl, createWater(216, 216), waterTexture);
    // const texture = await loadTexture(gl, '/textures/sognefjorden2.png');
    // const terrain = await initTerrain(gl, '/heatmaps/sognefjorden.png', texture);
    // const texture = await loadTexture(gl, '/textures/texture2.png');
    // const terrain = await initTerrain(gl, '/heatmaps/1.jpg', texture);
    // const cube = createBuffers(gl, createCube(), texture);
    if (!water || !terrainProgram || !terrain) {
        return;
    }

    const properties: ProgramProperties = {
        cameraPosition: Vec3.fromValues(0, 0, 300),
        center: Vec3.fromValues(0, 0, 0),
        rotation: 0,
        directionalLightVector: Vec3.fromValues(0, 0, 1)
    };

    const eventTarget = initControls(canvas);
    eventTarget.addEventListener('change', e => {
        const {detail: {rx, ry, rz, dx, dy, dz, dl}} = e as CustomEvent;
        const {center, cameraPosition, directionalLightVector} = properties;
        if (dl) {
            Vec3.rotateZ(directionalLightVector, directionalLightVector, [0, 1, 1], 10 * dl);
        }
        Vec3.add(center, center, [dx, dy, dz]);
        Vec3.add(cameraPosition, cameraPosition, [dx, dy, dz]);

        const cameraVector = Vec3.create();
        Vec3.negate(cameraVector, center);
        Vec3.add(cameraVector, cameraVector, cameraPosition);
        Vec3.rotateX(cameraVector, cameraVector, [0, 0, 0], rx / 30)
        Vec3.rotateY(cameraVector, cameraVector, [0, 0, 0], ry / 100)
        Vec3.add(cameraPosition, cameraVector, center);
    })
    function render() {
        drawScene({
            program: terrainProgram!,
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
    uniformNames: string[],
    attributeNames: string[]
): Program | null{

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
    program.uniforms = uniformNames.reduce<Program['uniforms']>((acc, name) => {
        acc[name] = gl.getUniformLocation(program, name) as WebGLUniformLocation;
        return acc;
    }, {});
    program.attributes = attributeNames.reduce<Program['attributes']>((acc, name) => {
        acc[name] = gl.getAttribLocation(program, name);
        return acc;
    }, {});
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

    const fovy = 45 * Math.PI / 180;
    const ratio = width / height;
    Mat4.perspective(projection, fovy, ratio, 0.1, 1000.0);

    Mat4.lookAt(model, properties.cameraPosition, properties.center, [0, 1, 0]);

    return {model, projection}
}

function drawScene(props: {
    program: Program,
    properties: ProgramProperties,
    terrain: BufferObject,
    water: BufferObject
}) {
    const {program, properties, terrain, water} = props;
    const {gl} = program;
    const {model, projection} = prepareScene(gl, properties);

    // Draw terrain
    gl.useProgram(program);

    bindBuffer(gl, terrain.buffers.position, program.attributes.position, 3);
    // bindBuffer(gl, terrain.buffers.color, program.attributes.aVertexColor, 4);
    bindBuffer(gl, terrain.buffers.texture, program.attributes.textureCoord, 2);
    bindBuffer(gl, terrain.buffers.normal, program.attributes.normal, 3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrain.buffers.indices);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, terrain.texture);

    gl.uniformMatrix4fv(
        program.uniforms.projection,
        false,
        projection
    );
    gl.uniformMatrix4fv(
        program.uniforms.model,
        false,
        model
    );
    gl.uniform3fv(program.uniforms.directionalLightVector, new Float32Array(properties.directionalLightVector))
    gl.uniform1i(program.uniforms.texture, 0);

    gl.drawElements(gl.TRIANGLES, terrain.size, gl.UNSIGNED_SHORT, 0);

    // Draw water
    Mat4.translate(model, model, [0, 0, 4]);
    gl.uniformMatrix4fv(
        program.uniforms.model,
        false,
        model
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, water.texture);
    bindBuffer(gl, water.buffers.position, program.attributes.position, 3);
    bindBuffer(gl, water.buffers.texture, program.attributes.textureCoord, 2);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, water.buffers.indices);
    gl.drawElements(gl.TRIANGLES, water.size, gl.UNSIGNED_SHORT, 0);


}