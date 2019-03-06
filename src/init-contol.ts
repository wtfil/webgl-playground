import {EventEmitter} from 'events';

export function initControls() {
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

    window.addEventListener('wheel', e => {
        const {deltaY: dy} = e;
        if (dy) {
            ee.emit('zoom', {
                dy: dy / Math.abs(dy) * 10
            });
        }
    })
    window.addEventListener('keypress', e => {
        switch (e.key) {
            case 'r':
                ee.emit('toggleRenderWater');
                break;
            case 't':
                ee.emit('toggleRenderTerrain');
                break;
            default:
                pressed[e.key] = true;
        }
    });
    window.addEventListener('keyup', e => {
        pressed[e.key] = false;
    })
    return ee;
}