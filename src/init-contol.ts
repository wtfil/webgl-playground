import {EventEmitter} from 'events';

export function initControls(elem: HTMLElement) {
    let mousedown = false;
    let pressed: {[key: string]: boolean} = {};
    const ee = new EventEmitter();
    const pullKeys = () => {
        let left = 0;
        let forward = 0;
        let ds = 0; 

        if (pressed.w && !pressed.s) {
            forward = 1;
        } else if (pressed.s && !pressed.w) {
            forward = -1
        }

        if (pressed.a && !pressed.d) {
            left = 1;
        } else if (pressed.d && !pressed.a) {
            left = -1;
        }

        if (pressed.j && !pressed.k) {
            ds -= 1000 * 360;
        } else if (pressed.k && !pressed.j) {
            ds += 1000 * 360;
        }

        if (forward || left) {
            ee.emit('moveCamera', {forward, left});
        }
        if (ds) {
            ee.emit('moveSun', {ds});
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
            e.preventDefault();
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
    elem.addEventListener('contextmenu', e => {
        e.preventDefault();
    })
    window.addEventListener('mousemove', e => {
        const {movementX, movementY} = e;
        if (mousedown) {
            ee.emit('rotateCamera', {dx: -movementX, dy: movementY})
        }
    })

    window.addEventListener('blur', () => {
        pressed = {};
        ee.emit('visability', {visible: false});
    })

    window.addEventListener('focus', () => {
        ee.emit('visability', {visible: true});
    })

    return ee;
}