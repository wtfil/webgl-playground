import {createTerrain} from './create-terrain';
import {initControls} from './init-contol';
import {createWater} from './create-water';
import {createSun} from './create-sun';
import {Unpacked} from './types';
import {
    getInitialState,
    toggle,
    zoom,
    rorateCamera,
    moveSun,
    autoMoveSun,
    updateWaterTime,
    State,
    moveCamera
} from './store';

window.addEventListener('load', setup);

const SIZE = Math.min(window.innerWidth, window.innerHeight, 1024);
const CANVAS_WIDTH = SIZE
const CANVAS_HEIGHT = SIZE;
const WATER_SIZE = SIZE * 2;
const DETAILS_LEVEL = 4;

async function setup() {
    const canvas = document.querySelector('canvas')!;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const gl = canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    if (!gl) {
        console.warn('Can not create webgl context');
        return;
    }

    const terrain = await createTerrain(gl, {
        heatmap: 'heightmaps/terrain4.png',
        height: 500 / DETAILS_LEVEL,
        chunkSize: 20 / DETAILS_LEVEL,
        baseLevel: 50 / DETAILS_LEVEL,
    });

    const water = await createWater(gl, {
        size: WATER_SIZE,
    })

    const sun = createSun(gl);

    const state = getInitialState();
    const {emitter} = initControls(canvas);

    emitter
        .on('visability', e => state.app.active = e.visability)
        .on('toggleRenderWater', () => toggle(state, 'water', 'visible'))
        .on('toggleRenderTerrain', () => toggle(state, 'terrain', 'visible'))
        .on('toggleRefraction', () => toggle(state, 'water', 'useRefraction'))
        .on('toggleReflection', () => toggle(state, 'water', 'useReflection'))
        .on('toggleRenderSun', () => toggle(state, 'sky', 'visible'))
        .on('toggleAutoSunMove', () => toggle(state, 'sky', 'autoSunMove'))
        .on('zoom', e => zoom(state, e.dy))
        .on('moveCamera', e => moveCamera(state, e))
        .on('rotateCamera', e => rorateCamera(state, e.dx / 500, e.dy))
        .on('moveSun', e => moveSun(state, e.ds))
    
    function render() {
        if (!state.app.active) {
            return requestAnimationFrame(render);
        }
        updateWaterTime(state)
        autoMoveSun(state, 3e5);
        drawScene({
            gl: gl!,
            state,
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
    state: State,
    terrain: Unpacked<ReturnType<typeof createTerrain>>,
    water: Unpacked<ReturnType<typeof createWater>>,
    sun: Unpacked<ReturnType<typeof createSun>>
}) {
    const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    const terrainScale = [WATER_SIZE, WATER_SIZE, 100];
    const {
        gl,
        terrain,
        water,
        sun,
        state
    } = props;
    const opts = {
        state,
        terrainScale,
        aspect
    };

    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (state.water.visible) {
        water.updateReflectionTexture(() => {
            if (state.terrain.visible) {
                terrain.render({
                    ...opts,
                    clipDirection: -1,
                    flip: true
                })
            }
            if (state.sky.visible) {
                sun.render({
                    ...opts,
                    flip: true
                });
            } else {
                 gl.clearColor(0.53, 0.8, 0.98, 1.); 
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

    if (state.terrain.visible) {
        terrain.render(opts)
    }
    if (state.water.visible) {
        water.render(opts);
    }
    if (state.sky.visible) {
        sun.render(opts);
    }
}
