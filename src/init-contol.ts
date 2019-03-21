import {EventEmitter} from 'events';

export function initControls(elem: HTMLElement) {
    let mousedown = false;
    const ee = new EventEmitter();
    const pressed: {[key: string]: boolean} = {};
    const pullKeys = () => {
        const s = 0.01;
        let dl = 0;
        let dx = 0;
        let dy = 0;

        if (pressed['[']) {
            dl = -s;
        } else if (pressed[']']) {
            dl = s;
        }
        if (pressed.w) {
            dy = 1;
        } else if (pressed.s) {
            dy = -1
        }

        if (pressed.a) {
            dx = -1;
        } else if (pressed.d) {
            dx = 1;
        }

        if (dx || dy) {
            ee.emit('move', { dx, dy });
        }

        if (dl) {
            ee.emit('changeLight', {dl});
        }

        requestAnimationFrame(pullKeys);
    }
    pullKeys();

    elem.addEventListener('wheel', e => {
        const {deltaY: dy} = e;
        if (dy) {
            ee.emit('zoom', {
                dy: dy / Math.abs(dy) * 10
            });
        }
    })
    window.addEventListener('keypress', e => {
        switch (e.key) {
            case '1':
                ee.emit('toggleRenderTerrain');
                break;
            case '2':
                ee.emit('toggleRenderWater');
                break;
            case '3':
                ee.emit('toggleRefraction');
                break;
            case '4':
                ee.emit('toggleReflection');
                break;
            case '5':
                ee.emit('toggleRenderSun');
                break;
            default:
                pressed[e.key] = true;
        }
    });
    window.addEventListener('keyup', e => {
        pressed[e.key] = false;
    })

    elem.addEventListener('mousedown', () => {
        mousedown = true;
    })
    window.addEventListener('mouseup', () => {
        mousedown = false;
    })
    window.addEventListener('mousemove', e => {
        const {movementX, movementY} = e;
        if (mousedown) {
            ee.emit('rotate', {dx: -movementX, dy: movementY})
        }
    })
    return ee;
}