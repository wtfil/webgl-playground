import Vec3 = require('gl-matrix/vec3');

import {createTerrain} from './create-terrain';
import {initControls} from './init-contol';
import {createWater} from './create-water';
import {createSun, getSunPosition} from './create-sun';
import {renderProperties, initProperties} from './program-properties';
import {inRange} from './utils';
import {ProgramProperties, Unpacked} from './types';

window.addEventListener('load', setup);

const SIZE = Math.min(window.innerWidth, window.innerHeight);
const CANVAS_WIDTH = SIZE
const CANVAS_HEIGHT = SIZE;
const WATER_SIZE = SIZE * 2;
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

    const terrain = await createTerrain(gl, {
        heatmap: 'heightmaps/mountain2.png',
        height: 500 / DETAILS_LEVEL,
        size: DETAILS_LEVEL,
        baseLevel: 50 / DETAILS_LEVEL
    });

    const water = await createWater(gl, {
        size: WATER_SIZE,
    })

    const sun = createSun(gl);

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
            const nextDistance = inRange(distance + e.dy, 50, 1000);
            Vec3.sub(eye, cameraPosition, center);
            Vec3.scale(eye, eye, nextDistance / distance);
            Vec3.add(cameraPosition, center, eye);
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
        .on('moveSun', e => {
            properties.sunTime += e.ds;
            updateProperties();
        })
    
    const updateProperties = () => {
        // saveProperties(properties);
        renderProperties(propertiesNode, properties);
    }

    function render() {
        const time = Date.now() - properties.start;
        const {sunPosition, altitude, azimuth} = getSunPosition(properties.sunTime);
        const directionalLightVector = Vec3.create();
        Vec3.negate(directionalLightVector, sunPosition);
        Object.assign(properties, {
            time,
            sunPosition,
            directionalLightVector,
            azimuth,
            altitude
        });
        updateProperties();
        drawScene({
            gl: gl!,
            properties,
            terrain,
            water,
            sun
        });
        requestAnimationFrame(render);
    }
    
    render();
    updateProperties();
}


function drawScene(props: {
    gl: WebGLRenderingContext,
    properties: ProgramProperties,
    terrain: Unpacked<ReturnType<typeof createTerrain>>,
    water: Unpacked<ReturnType<typeof createWater>>,
    sun: Unpacked<ReturnType<typeof createSun>>
}) {
    const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    const {
        gl,
        terrain,
        water,
        sun,
        properties
    } = props;
    const opts = {
        ...properties,
        aspect
    }


    gl.clearDepth(1.0);
    gl.clearColor(0.53, 0.8, 0.98, 1.);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (properties.renderWater) {
        water.updateReflectionTexture(() => {
            if (properties.renderTerrain) {
                terrain.render({
                    ...opts,
                    clipDirection: -1,
                    flip: true
                })
            }
            if (properties.renderSun) {
                sun.render({
                    ...opts,
                    flip: true
                });
            }
        })
        water.updateRefractionTexture(() => {
            if (properties.renderTerrain) {
                terrain.render({
                    ...opts,
                    clipDirection: 1
                })
            }
        });
    }

    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (properties.renderSun) {
        sun.render(opts);
    }
    if (properties.renderWater) {
        water.render(opts);
    }
    if (properties.renderTerrain) {
        terrain.render(opts)
    }
}
