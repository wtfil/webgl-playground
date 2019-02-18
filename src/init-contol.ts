import {EventEmitter} from 'events';

export function initControls() {
    const ee = new EventEmitter();
    const pressed: {[key: string]: boolean} = {};
    const pullKeys = () => {
        const s = 0.01;
        let pitch = 0;
        let yaw = 0;
        let dl = 0;


        if (pressed.w) {
            pitch = s;
        } else if (pressed.s) {
            pitch = -s;
        }

        if (pressed.a) {
            yaw = -s;
        } else if (pressed.d) {
            yaw = s;
        }
        if (pressed['[']) {
            dl = -s;
        } else if (pressed[']']) {
            dl = s;
        }

        if (pitch || yaw) {
            ee.emit('move', {pitch, yaw});
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