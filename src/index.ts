import Vec3 = require('gl-matrix/vec3');

import {createTerrain} from './create-terrain';
import {initControls} from './init-contol';
import {createWater} from './create-water';
import {createSun, getSunPosition} from './create-sun';
import {initProperties} from './program-properties';
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
    const gl = canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    if (!gl) {
        console.warn('Can not create webgl context');
        return;
    }

    let pageIsVisible = true;

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
        .on('visability', e => {
            pageIsVisible = e.visible;
        })
        .on('toggleRenderWater', () => {
            properties.renderWater = !properties.renderWater;
        })
        .on('toggleRenderTerrain', () => {
            properties.renderTerrain = !properties.renderTerrain;
        })
        .on('toggleRefraction', () => {
            properties.useRefraction = !properties.useRefraction;
        })
        .on('toggleReflection', () => {
            properties.useReflection = !properties.useReflection;
        })
        .on('toggleRenderSun', () => {
            properties.renderSun = !properties.renderSun;
        })
        .on('zoom', e => {
            const {cameraPosition, center} = properties;
            const eye = Vec3.create();
            const distance = Vec3.distance(center, cameraPosition);
            const nextDistance = inRange(distance + e.dy, 50, 1000);
            Vec3.sub(eye, cameraPosition, center);
            Vec3.scale(eye, eye, nextDistance / distance);
            Vec3.add(cameraPosition, center, eye);
        })
        .on('moveCamera', e => {
            const {cameraPosition, center} = properties;
            const {forward, left} = e;
            const forwardMove = Vec3.create();
            const leftMove = Vec3.create();
            const move = Vec3.create();
            Vec3.sub(forwardMove, center, cameraPosition);
            Vec3.rotateZ(leftMove, forwardMove, [0, 0, 1], Math.PI / 2);
            leftMove[2] = 0;

            if (forward === 1) {
                Vec3.add(move, move, forwardMove);
            }
            if (forward === -1) {
                Vec3.sub(move, move, forwardMove);
            }
            if (left === 1) {
                Vec3.add(move, move, leftMove);
            }
            if (left === -1) {
                Vec3.sub(move, move, leftMove);
            }

            Vec3.normalize(move, move);
            Vec3.scale(move, move, 3);
            Vec3.add(cameraPosition, cameraPosition, move)
            Vec3.add(center, center, move);
        })
        .on('rotateCamera', e => {
            const {dx, dy} = e;
            const {cameraPosition, center} = properties;
            const dmy = cameraPosition[0] > 0 ? 1 : -1;
            Vec3.rotateZ(cameraPosition, cameraPosition, center, dx / 100);
            Vec3.rotateY(cameraPosition, cameraPosition, center, dy * dmy / 100);
        })
        .on('moveSun', e => {
            properties.sunTime += e.ds;
        })
    
    function render() {
        if (!pageIsVisible) {
            return requestAnimationFrame(render);
        }
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
