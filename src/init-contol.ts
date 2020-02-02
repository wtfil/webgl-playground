import {EventEmitter} from 'events';

const toggles = [
    {
        id: 'water',
        action: 'toggleRenderWater'
    },
    {
        id: 'terrain',
        action: 'toggleRenderTerrain'
    },
    {
        id: 'reflection',
        action: 'toggleReflection'
    },
    {
        id: 'refraction',
        action: 'toggleRefraction'
    },
    {
        id: 'sky',
        action: 'toggleRenderSun'
    },
    {
        id: 'autopilot',
        action: 'toggleAutoPilot'
    },
    {
        id: 'auto-sun',
        action: 'toggleAutoSunMove'
    },
]

export function initControls(elem: HTMLElement) {
    let mousedown = false;
    let prevTouch: Touch | null;
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
            case '7':
                ee.emit('toggleAutoPilot');
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

    const onTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0]
        if (prevTouch) {
            ee.emit('rotateCamera', {
                dx: touch.clientX - prevTouch.clientX,
                dy: prevTouch.clientY - touch.clientY
            });
        }
        prevTouch = touch;
    }
    const onTouchStart = (e: TouchEvent) => {
        prevTouch = null;
    }

    const tearDown = () => {
        ee.removeAllListeners();
        elem.removeEventListener('wheel', onWheel);
        elem.removeEventListener('mousedown', onMouseDown)
        elem.removeEventListener('contextmenu', onContextMenu)
        elem.removeEventListener('touchmove', onTouchMove)
        elem.removeEventListener('touchstart', onTouchStart)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('keypress', onKeyPress);
        window.removeEventListener('keyup', onKeyup);
        // TODO removeEventListener from toggles
    }

    pullKeys();

    elem.addEventListener('wheel', onWheel);
    elem.addEventListener('mousedown', onMouseDown)
    elem.addEventListener('contextmenu', onContextMenu)
    elem.addEventListener('touchmove', onTouchMove)
    elem.addEventListener('touchstart', onTouchStart)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keypress', onKeyPress);
    window.addEventListener('keyup', onKeyup);
    toggles.forEach(item => {
        const toggle = document.querySelector(`[data-toggle-id=${item.id}]`);
        if (!toggle) {
            return;
        }
        toggle.addEventListener('toggle', () => ee.emit(item.action))
    })

    return {
        emitter: ee,
        tearDown
    }
}
