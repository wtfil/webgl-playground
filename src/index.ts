import {mat4 as Mat4, vec3 as Vec3} from 'gl-matrix';

import terrainVertextShaderSource from './shaders/terrain.vertex.glsl';
import terrainFragmentShaderSource from './shaders/terrain.fragment.glsl';
import waterVertextShaderSource from './shaders/water.vertex.glsl';
import waterFragmentShaderSource from './shaders/water.fragment.glsl';
import sunVertextShaderSource from './shaders/sun.vertex.glsl';
import sunFragmentShaderSource from './shaders/sun.fragment.glsl';
import {createTerrain} from './create-terrain';
import {initControls} from './init-contol';
import {createWater} from './create-water';
import {renderProperties} from './render-properties';
import {createLazyFramebufferAndTexture, createProgram, loadTexture, createBuffer, bindBuffer} from './utils';

import {ProgramProperties, BufferObject, Program} from './types';

window.addEventListener('load', setup);

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1024;

const DETAILS_LEVEL = 5;

async function setup() {
    const canvas = document.querySelector('canvas')!;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const gl = canvas.getContext('experimental-webgl');
    if (!gl) {
        console.warn('Can not create webgl context')
        return;
    }

    const propertiesNode = document.querySelector('[data-properties]') as HTMLTableElement;

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
    const sunProgram = createProgram(
        gl,
        sunVertextShaderSource,
        sunFragmentShaderSource
    )
    
    const terrainData = await createTerrain('/heightmaps/mountain2.png', 500 / DETAILS_LEVEL, DETAILS_LEVEL);
    const terrain = terrainData && createBuffers(gl, terrainData, {});

    const dudvTexture = await loadTexture(gl, '/textures/dudvmap.png');
    const normalMapTexture = await loadTexture(gl, '/textures/normalmap.png');
    const water = createBuffers(gl, createWater(), {dudv: dudvTexture, normalMap: normalMapTexture});

    if (!water || !waterProgram || !terrainProgram || !terrain || !sunProgram) {
        return;
    }

    const properties: ProgramProperties = {
        center: Vec3.fromValues(-23.0, +20.0, 0.0),
        cameraPosition: Vec3.fromValues(-24.2, -254.7, +53.7),

        directionalLightVector: Vec3.fromValues(0, 0, 1),
        start: Date.now(),
        time: 0,
        renderWater: true,
        renderTerrain: true,
        useReflection: true,
        useRefraction: true,
        renderSun: true
    };

    const emitter = initControls(canvas);

    emitter
        .on('toggleRenderWater', () => {
            properties.renderWater = !properties.renderWater;
            updateProperties();
        })
        .on('toggleRenderTerrain', () => {
            properties.renderTerrain = !properties.renderTerrain;
            updateProperties();
        })
        .on('toggleRefraction', () => {
            properties.useRefraction = !properties.useRefraction;
            updateProperties();
        })
        .on('toggleReflection', () => {
            properties.useReflection = !properties.useReflection;
            updateProperties();
        })
        .on('toggleRenderSun', () => {
            properties.renderSun = !properties.renderSun;
            updateProperties();
        })
        .on('zoom', e => {
            const {cameraPosition, center} = properties;
            const eye = Vec3.create();
            const distance = Vec3.distance(center, cameraPosition);
            const nextDistance = distance + e.dy;
            if (nextDistance <= 50 || nextDistance >= 300) {
                return;
            }
            Vec3.sub(eye, cameraPosition, center);
            Vec3.scale(eye, eye, nextDistance / distance);
            Vec3.add(cameraPosition, center, eye);
            updateProperties();
        })
        .on('move', e => {
            const move = Vec3.fromValues(e.dx, e.dy, 0);
            const {cameraPosition, center} = properties;
            Vec3.add(cameraPosition, cameraPosition, move);
            Vec3.add(center, center, move);
            updateProperties();
        })
        .on('rotate', e => {
            const {cameraPosition, center} = properties;
            const distance = Vec3.distance(center, cameraPosition);
            const eye = Vec3.create();
            Vec3.sub(eye, cameraPosition, center);
            Vec3.add(eye, eye, [e.dx, e.dy, 0]);
            Vec3.normalize(eye, eye);
            Vec3.scale(eye, eye, distance);
            Vec3.add(cameraPosition, center, eye);
            updateProperties();
        })
        .on('changeLight', e => {
            const {directionalLightVector} = properties;
            Vec3.rotateZ(directionalLightVector, directionalLightVector, [0, 1, 1], e.dl);
            updateProperties();
        })
    
    const updateProperties = () => {
        renderProperties(propertiesNode, properties);
    }

    function render() {
        properties.time = Date.now() - properties.start;
        drawScene({
            gl: gl!,
            terrainProgram: terrainProgram!,
            waterProgram: waterProgram!,
            sunProgram: sunProgram!,
            properties,
            terrain: terrain!,
            water: water!
        });
        requestAnimationFrame(render);
    }
    
    render();
    updateProperties();
}

function createBuffers(
    gl: WebGLRenderingContext,
    arrays: {
        [key: string]: number[]
    },
    textures: BufferObject['textures']
): BufferObject {
    return {
        buffers: {
            position: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.position)),
            colors: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.colors)),
            indices: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrays.indices)),
            normal: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.normals)),
            texture: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.texture))
        },
        textures,
        size: arrays.indices.length
    }
}

function createMatrices(properties: ProgramProperties, flip: boolean = false) {
    const projection = Mat4.create();
    const model = Mat4.create();
    let eye: Vec3;
    if (flip) {
        eye = Vec3.create();
        Vec3.sub(eye, properties.cameraPosition, properties.center);
        eye[2] = -eye[2];
        Vec3.add(eye, eye, properties.center);
    } else {
        eye = properties.cameraPosition;
    }
    Mat4.perspective(projection, 45 * Math.PI / 180, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 1000.0);
    Mat4.lookAt(model, eye, properties.center, [0, 1, 0]);
    return {model, projection};
}

function drawScene(props: {
    gl: WebGLRenderingContext,
    terrainProgram: Program,
    waterProgram: Program,
    sunProgram: Program,
    properties: ProgramProperties,
    terrain: BufferObject,
    water: BufferObject
}) {
    
    const waterHeight = 50 / DETAILS_LEVEL;
    const waterSize = 512;
    let {gl, terrainProgram, waterProgram, sunProgram, properties, terrain, water} = props;
    let refractionTexture: WebGLTexture;
    let reflectionTexture: WebGLTexture;

    const renderTerrain = (clipLevel: -1 | 1 | 0, flip: boolean) => {
        if (!properties.renderTerrain) {
            return;
        }
        const {model, projection} = createMatrices(properties, flip);
        // reflection
        if (flip) {
            Mat4.translate(model, model, [0, 0, 2 * clipLevel * waterHeight]);
        }

        gl.useProgram(terrainProgram.program);
        bindBuffer(gl, terrain.buffers.position, terrainProgram.attributes.position, 3);
        // bindBuffer(gl, terrain.buffers.texture, terrainProgram.attributes.textureCoord, 2);
        bindBuffer(gl, terrain.buffers.normal, terrainProgram.attributes.normal, 3);
        bindBuffer(gl, terrain.buffers.colors, terrainProgram.attributes.colors, 4);
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

        gl.uniform3fv(terrainProgram.uniforms.directionalLightVector, properties.directionalLightVector);
        gl.uniform1f(terrainProgram.uniforms.clipZ, waterHeight);
        gl.uniform1f(terrainProgram.uniforms.clipLevel, clipLevel);

        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_2D, terrain.textures.surface);
        // gl.uniform1i(terrainProgram.uniforms.texture, 0);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawElements(gl.TRIANGLES, terrain.size, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.BLEND);
    }

    const getRefractTexture = () => {
        const width = waterSize;
        const height = waterSize;
        const {framebuffer, texture} = createLazyFramebufferAndTexture(gl, width, height, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        renderTerrain(1, false);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return texture;
    }
    const getReflectionTexture = () => {
        const width = waterSize;
        const height = waterSize;
        const {framebuffer, texture} = createLazyFramebufferAndTexture(gl, width, height, 1);

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        renderTerrain(-1, true);
        renderSun();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return texture;
    }

    const renderWater = () => {
        if (!properties.renderWater) {
            return;
        }
        const {model, projection} = createMatrices(properties);
        Mat4.translate(model, model, [0, 0, waterHeight]);
        Mat4.scale(model, model, [waterSize, waterSize, 1]);

        gl.useProgram(waterProgram.program);
        bindBuffer(gl, water.buffers.position, waterProgram.attributes.position, 3);
        bindBuffer(gl, water.buffers.texture, waterProgram.attributes.textureCoord, 2);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, water.buffers.indices);

        gl.uniform1f(waterProgram.uniforms.dudvOffset, (properties.time / 1000 * 0.06) % 1);
        gl.uniform1i(waterProgram.uniforms.useRefraction, Number(properties.useRefraction));
        gl.uniform1i(waterProgram.uniforms.useReflection, Number(properties.useReflection));
        gl.uniform3fv(waterProgram.uniforms.center, properties.center);
        gl.uniform3fv(waterProgram.uniforms.cameraPosition, properties.cameraPosition);
        gl.uniform3fv(waterProgram.uniforms.directionalLightVector, properties.directionalLightVector);
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
        gl.bindTexture(gl.TEXTURE_2D, water.textures.dudv);
        gl.uniform1i(waterProgram.uniforms.dudvTexture, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, water.textures.normalMap);
        gl.uniform1i(waterProgram.uniforms.normalMapTexture, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, refractionTexture);
        gl.uniform1i(waterProgram.uniforms.refractionTexture, 2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, reflectionTexture);
        gl.uniform1i(waterProgram.uniforms.reflectionTexture, 3);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawElements(gl.TRIANGLES, water.size, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.BLEND);
    }

    function renderSun() {
        if (!properties.renderSun) {
            return;
        }

        const {model, projection} = createMatrices(properties);
        const position = [
            50, 0, 100,
            50, 100, 100,
            150, 100, 100
        ];
        const indices = [0, 1, 2];
        const positionBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(position));
        const indicesBuffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices));

        gl.useProgram(sunProgram.program);

        bindBuffer(gl, positionBuffer, sunProgram.attributes.position, 3);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);

        gl.uniformMatrix4fv(
            sunProgram.uniforms.projection,
            false,
            projection
        );

        gl.uniformMatrix4fv(
            sunProgram.uniforms.model,
            false,
            model
        );

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.BLEND);
    }

    gl.clearDepth(1.0);
    gl.clearColor(0.53, 0.8, 0.98, 1.);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (properties.renderWater) {
        refractionTexture = getRefractTexture();
        reflectionTexture = getReflectionTexture();
    }
    
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    renderTerrain(0, false);
    renderWater();
    renderSun();

}
