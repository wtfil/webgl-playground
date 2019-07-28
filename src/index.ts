import Mat4 = require('gl-matrix/mat4');
import Vec3 = require('gl-matrix/vec3');

import terrainVertextShaderSource from './shaders/terrain.vertex.glsl';
import terrainFragmentShaderSource from './shaders/terrain.fragment.glsl';
import waterVertextShaderSource from './shaders/water.vertex.glsl';
import waterFragmentShaderSource from './shaders/water.fragment.glsl';
import sunVertextShaderSource from './shaders/sun.vertex.glsl';
import sunFragmentShaderSource from './shaders/sun.fragment.glsl';
import {createTerrain} from './create-terrain';
import {initControls} from './init-contol';
import {createWater} from './create-water';
import {createSun, getSunPosition} from './create-sun';
import {renderProperties, initProperties, saveProperties} from './program-properties';
import {createFramebufferAndTexture, createProgram, loadTexture, createBuffer, bindBuffer, inRange} from './utils';

import {ProgramProperties, BufferObject, Program} from './types';

window.addEventListener('load', setup);

const SIZE = Math.min(window.innerWidth / 2, window.innerHeight);
const CANVAS_WIDTH = SIZE
const CANVAS_HEIGHT = SIZE;

const WATER_SIZE = SIZE;

const DETAILS_LEVEL = 5;

async function setup() {
    const canvas = document.querySelector('canvas')!;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const gl = canvas.getContext('experimental-webgl');
    if (!gl) {
        console.warn('Can not create webgl context');
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
    
    const terrainData = await createTerrain('heightmaps/mountain2.png', 500 / DETAILS_LEVEL, DETAILS_LEVEL);
    const terrain = terrainData && createBuffers(gl, {
        arrays: terrainData
    });

    const dudvTexture = await loadTexture(gl, 'textures/dudvmap.png');
    const normalMapTexture = await loadTexture(gl, 'textures/normalmap.png');
    const [
        refractionTexture,
        refractionFramebuffer
    ] = createFramebufferAndTexture(gl, WATER_SIZE, WATER_SIZE);
    const [
        reflectionTexture,
        reflectionFramebuffer
    ] = createFramebufferAndTexture(gl, WATER_SIZE, WATER_SIZE);
    const water = createBuffers(gl, {
        arrays: createWater(),
        framebuffers: {
            refraction: refractionFramebuffer,
            reflection: reflectionFramebuffer
        },
        textures: {
            dudv: dudvTexture,
            normalMap: normalMapTexture,
            refraction: refractionTexture,
            reflection: reflectionTexture
        }
    });

    const sun = createBuffers(gl, {
        arrays: createSun()
    });

    if (!water || !waterProgram || !terrainProgram || !terrain || !sunProgram) {
        return;
    }

    const properties = initProperties();
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
            const nextDistance = inRange(distance + e.dy, 50, 500);
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
        .on('moveCamera', e => {
            const {cameraPosition, center} = properties;
            const distance = Vec3.distance(center, cameraPosition);
            const eye = Vec3.create();
            Vec3.sub(eye, cameraPosition, center);
            const proj = Vec3.clone(eye);
            proj[2] = 0;
            const angle = inRange(
                Vec3.angle(eye, proj) + e.dy * 1e-2,
                0.1,
                Math.PI / 3
            );
            proj[2] = distance * Math.sin(angle);
            Vec3.copy(eye, proj);
            Vec3.rotateZ(eye, eye, [0, 0, 0], e.dx * 1e-2)
            Vec3.add(cameraPosition, center, eye);
            updateProperties();
        })
        .on('changeLight', e => {
            const {directionalLightVector} = properties;
            Vec3.rotateZ(directionalLightVector, directionalLightVector, [0, 1, 1], e.dl);
            updateProperties();
        })
    
    const updateProperties = () => {
        saveProperties(properties);
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
            water: water!,
            sun
        });
        requestAnimationFrame(render);
    }
    
    render();
    updateProperties();
}

function createBuffers(
    gl: WebGLRenderingContext,
    opts: {
        arrays: {
            [key: string]: number[]
        },
        textures?: BufferObject['textures'],
        framebuffers?: BufferObject['framebuffers']
    }
): BufferObject {
    const {arrays, textures = {}, framebuffers = {}} = opts;
    return {
        buffers: {
            position: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.position)),
            colors: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.colors)),
            indices: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrays.indices)),
            normal: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.normals)),
            texture: createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(arrays.texture))
        },
        textures,
        framebuffers,
        size: arrays.indices.length
    }
}

function createMatrices(properties: ProgramProperties, flip: boolean = false) {
    const projection = Mat4.create();
    const view = Mat4.create();
    const model = Mat4.create();
    let eye: Vec3;
    if (flip) {
        eye = Vec3.clone(properties.cameraPosition);
        Vec3.sub(eye, eye, properties.center);
        eye[2] = -eye[2];
        Vec3.add(eye, eye, properties.center);
    } else {
        eye = properties.cameraPosition;
    }
    Mat4.perspective(projection, 45 * Math.PI / 180, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 1000.0);
    Mat4.lookAt(view, eye, properties.center, [0, 0, 1]);
    return {model, projection, view};
}

function drawScene(props: {
    gl: WebGLRenderingContext,
    terrainProgram: Program,
    waterProgram: Program,
    sunProgram: Program,
    properties: ProgramProperties,
    terrain: BufferObject,
    water: BufferObject,
    sun: BufferObject
}) {
    
    const waterHeight = 50 / DETAILS_LEVEL;
    const {gl, terrainProgram, waterProgram, sunProgram, properties, terrain, water, sun} = props;

    const renderTerrain = (clipLevel: -1 | 1 | 0, flip: boolean) => {
        if (!properties.renderTerrain) {
            return;
        }
        const {projection, model, view} = createMatrices(properties, flip);
        // reflection
        if (flip) {
            Mat4.translate(model, model, [0, 0,  clipLevel * waterHeight * 2]);
        }

        gl.useProgram(terrainProgram.program);
        bindBuffer(gl, terrain.buffers.position, terrainProgram.attributes.position, 3);
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
        gl.uniformMatrix4fv(
            terrainProgram.uniforms.view,
            false,
            view
        );

        gl.uniform3fv(terrainProgram.uniforms.directionalLightVector, properties.directionalLightVector);
        gl.uniform1f(terrainProgram.uniforms.clipZ, waterHeight);
        gl.uniform1f(terrainProgram.uniforms.clipLevel, clipLevel);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawElements(gl.TRIANGLES, terrain.size, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.BLEND);
    }

    const updateRefractionTexture = () => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, water.framebuffers.refraction);
        gl.viewport(0, 0, WATER_SIZE, WATER_SIZE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        renderTerrain(1, false);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    const updateReflectionTexture = () => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, water.framebuffers.reflection);
        gl.viewport(0, 0, WATER_SIZE, WATER_SIZE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        renderTerrain(-1, true);
        renderSun();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    const renderWater = () => {
        if (!properties.renderWater) {
            return;
        }
        const {view, model, projection} = createMatrices(properties);
        Mat4.translate(model, model, [0, 0, waterHeight]);
        Mat4.scale(model, model, [WATER_SIZE, WATER_SIZE, 1]);

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

        gl.uniformMatrix4fv(
            waterProgram.uniforms.view,
            false,
            view
        );

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, water.textures.dudv);
        gl.uniform1i(waterProgram.uniforms.dudvTexture, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, water.textures.normalMap);
        gl.uniform1i(waterProgram.uniforms.normalMapTexture, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, water.textures.refraction);
        gl.uniform1i(waterProgram.uniforms.refractionTexture, 2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, water.textures.reflection);
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

        const {view, projection} = createMatrices(properties);
        // const sunPosition = Vec3.fromValues(0, 1, 1);
        // const sunPosition = properties.directionalLightVector;
        const sunPosition = getSunPosition(properties.time);
        // const translate = Vec3.create();
        // Vec3.sub(translate, translate, properties.directionalLightVector);
        // Mat4.scale(model, model, [10, 10, 10]);
        // Vec3.scale(translate, translate, 10);
        // Mat4.translate(model, model, translate);

        gl.useProgram(sunProgram.program);

        bindBuffer(gl, sun.buffers.position, sunProgram.attributes.position, 3);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sun.buffers.indices);

        gl.uniform1f(
            sunProgram.uniforms.width,
            sunProgram.gl.canvas.width
        );

        gl.uniform1f(
            sunProgram.uniforms.height,
            sunProgram.gl.canvas.height
        );

        gl.uniform3fv(
            sunProgram.uniforms.sunPosition,
            sunPosition
        );
        gl.uniformMatrix4fv(
            sunProgram.uniforms.projection,
            false,
            projection
        );

        gl.uniformMatrix4fv(
            sunProgram.uniforms.view,
            false,
            view
        );

        // gl.uniformMatrix4fv(
        //     sunProgram.uniforms.model,
        //     false,
        //     model
        // );

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawElements(gl.TRIANGLES, sun.size, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.BLEND);
    }

    gl.clearDepth(1.0);
    gl.clearColor(0.53, 0.8, 0.98, 1.);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (properties.renderWater) {
        updateReflectionTexture();
        updateRefractionTexture();
    }

    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    renderTerrain(0, false);
    renderWater();
    renderSun();
}
