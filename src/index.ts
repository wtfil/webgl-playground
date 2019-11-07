import {createTerrain} from './create-terrain';
import {initControls} from './init-contol';
import {createWater} from './create-water';
import {createSky} from './create-sky';
import {Unpacked} from './types';
import {
    getInitialState,
    toggle,
    zoom,
    rotateCamera,
    moveSun,
    autoMoveSun,
    updateWaterTime,
    State,
    moveCamera,
    autoPilot
} from './store';

window.addEventListener('load', setup);

const CANVAS_ELEM_SIZE = Math.min(window.innerWidth, window.innerHeight, 1024);
const SIZE = 512;
const CANVAS_WIDTH = SIZE
const CANVAS_HEIGHT = SIZE;
const TERRAIN_SIZE = SIZE * 2;
const WATER_SIZE = SIZE * 2;
const SKY_DOME_SIZE = SIZE * 2;
const DETAILS_LEVEL = 4;

async function setup() {
    const canvas = document.querySelector('canvas')!;
    canvas.style.width = CANVAS_ELEM_SIZE + 'px';
    canvas.style.height = CANVAS_ELEM_SIZE + 'px';
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const gl = canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    if (!gl) {
        console.warn('Can not create webgl context');
        return;
    }

    const terrain = await createTerrain(gl, {
        heatmap: 'heightmaps/terrain5.png',
        chunkSize: 20 / DETAILS_LEVEL,
        baseLevel: 120,
        size: [TERRAIN_SIZE, TERRAIN_SIZE, 200]
    });

    const water = await createWater(gl, {
        size: WATER_SIZE,
    })

    const sky = createSky(gl, {
        size: SKY_DOME_SIZE
    });

    const state = getInitialState();
    const {emitter} = initControls(canvas);

    emitter
        .on('toggleRenderWater', () => toggle(state, 'water', 'visible'))
        .on('toggleRenderTerrain', () => toggle(state, 'terrain', 'visible'))
        .on('toggleRefraction', () => toggle(state, 'water', 'useRefraction'))
        .on('toggleReflection', () => toggle(state, 'water', 'useReflection'))
        .on('toggleRenderSun', () => toggle(state, 'sky', 'visible'))
        .on('toggleAutoSunMove', () => toggle(state, 'sky', 'autoSunMove'))
        .on('toggleAutoPilot', () => toggle(state, 'app', 'autoPilot'))
        .on('zoom', e => zoom(state, e.dy))
        .on('moveCamera', e => moveCamera(state, e))
        .on('rotateCamera', e => rotateCamera(state, e.dx / 500, e.dy))
        .on('moveSun', e => moveSun(state, e.sunTime * 1e5))
    
    function render() {
        if (!state.app.active) {
            return requestAnimationFrame(render);
        }
        updateWaterTime(state);
        autoMoveSun(state, 1e5);
        autoPilot(state);
        drawScene({
            gl: gl!,
            state,
            terrain,
            water,
            sky
        });
        requestAnimationFrame(render);
    }
    
    render();
}


function drawScene(props: {
    gl: WebGLRenderingContext,
    state: State,
    terrain: Unpacked<ReturnType<typeof createTerrain>>,
    water: Unpacked<ReturnType<typeof createWater>>,
    sky: Unpacked<ReturnType<typeof createSky>>
}) {
    const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    const {
        gl,
        terrain,
        water,
        sky,
        state
    } = props;
    const opts = {
        state,
        aspect
    };

    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);   
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (state.water.visible) {
        water.updateReflectionTexture(() => {
            if (state.sky.visible) {
                sky.render({
                    ...opts,
                    flip: true
                });
            }
            if (state.terrain.visible) {
                terrain.render({
                    ...opts,
                    clipDirection: -1,
                    flip: true
                })
            }
        })
        water.updateRefractionTexture(() => {
            if (state.terrain.visible) {
                terrain.render({
                    ...opts,
                    clipDirection: 1
                })
            }
        });
    }

    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (state.water.visible) {
        water.render(opts);
    }
    if (state.terrain.visible) {
        terrain.render(opts)
    }
    if (state.sky.visible) {
        sky.render(opts);
    } else {
        gl.clearColor(0.53, 0.8, 0.98, 1.);
    }
}