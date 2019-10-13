import {EventEmitter} from 'events';

export function initControls(elem: HTMLElement) {
    let mousedown = false;
    const pressed = new Set();
    const ee = new EventEmitter();
    const pullKeys = () => {
        let left = 0;
        let forward = 0;
        let up = 0;
        let sunTime = 0;
        if (pressed.has('w')) {
            forward ++;
        }
        if (pressed.has('s')) {
            forward --
        }
        if (pressed.has('a')) {
            left ++
        }
        if (pressed.has('d')) {
            left --
        }
        if (pressed.has('e')) {
            up ++
        }
        if (pressed.has('q')) {
            up --
        }
        if (pressed.has('j')) {
            sunTime --;
        }
        if (pressed.has('k')) {
            sunTime ++;
        }
        if (sunTime) {
            ee.emit('moveSun', {sunTime});
        }
        if (left || forward || up) {
            ee.emit('moveCamera', {left, forward, up});
        }

        requestAnimationFrame(pullKeys);
    }

    const onKeyPress = (e: KeyboardEvent) => {
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
            case '6':
                ee.emit('toggleAutoSunMove');
                break;
            default:
                pressed.add(e.key);
        }
    }

    const onWheel = (e: WheelEvent) => {
        const {deltaY: dy} = e;
        if (dy) {
            ee.emit('zoom', {
                dy: dy / Math.abs(dy) * 10
            });
            e.preventDefault();
        }
    }

    const onKeyup = (e: KeyboardEvent) => {
        pressed.delete(e.key)
    }

    const onMouseDown = () => {
        mousedown = true;
    }
    const onMouseUp = () => {
        mousedown = false;
    }
    const onMouseMove = (e: MouseEvent) => {
        const {movementX, movementY} = e;
        if (mousedown) {
            ee.emit('rotateCamera', {dx: -movementX, dy: movementY})
        }
    }

    const onContextMenu = (e: MouseEvent) => {
        e.preventDefault();
    }

    const tearDown = () => {
        ee.removeAllListeners();
        elem.removeEventListener('wheel', onWheel);
        elem.removeEventListener('mousedown', onMouseDown)
        elem.removeEventListener('contextmenu', onContextMenu)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('keypress', onKeyPress);
        window.removeEventListener('keyup', onKeyup);
    }

    pullKeys();

    elem.addEventListener('wheel', onWheel);
    elem.addEventListener('mousedown', onMouseDown)
    elem.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keypress', onKeyPress);
    window.addEventListener('keyup', onKeyup);

    return {
        emitter: ee,
        tearDown
    }
}