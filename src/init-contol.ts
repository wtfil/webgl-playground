import {State, moveSun, rotateCamera, moveCamera, zoom, toggle} from './store';

export function initControls(elem: HTMLElement, state: State) {
    const toggles = [
        {
            id: 'terrain',
            key: '1',
            getValue: () => state.terrain.visible,
            action: () => toggle(state, 'terrain', 'visible')
        },
        {
            id: 'water',
            key: '2',
            getValue: () => state.water.visible,
            action: () => toggle(state, 'water', 'visible')
        },
        {
            id: 'refraction',
            key: '3',
            getValue: () => state.water.useRefraction,
            action: () => toggle(state, 'water', 'useRefraction')
        },
        {
            id: 'reflection',
            key: '4',
            getValue: () => state.water.useReflection,
            action: () => toggle(state, 'water', 'useReflection')
        },
        {
            id: 'sky',
            key: '5',
            getValue: () => state.sky.visible,
            action: () => toggle(state, 'sky', 'visible')
        },
        {
            id: 'auto-sun',
            key: '6',
            getValue: () => state.sky.autoSunMove,
            action: () => toggle(state, 'sky', 'autoSunMove')
        },
        {
            id: 'autopilot',
            key: '7',
            getValue: () => state.app.autoPilot,
            action: () => toggle(state, 'app', 'autoPilot')
        },
    ]
    const setToggleValue = (item: typeof toggles[0]) => {
        const toggle = document.querySelector(`[data-toggle-id=${item.id}]`);
        if (item.getValue()) {
            toggle?.setAttribute('checked', 'checked');
        } else {
            toggle?.removeAttribute('checked');
        }
    }
    let mousedown = false;
    let prevTouch: Touch | null;
    const pressed = new Set();
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
            moveSun(state, sunTime * 3e5);
        }
        if (left || forward || up) {
            moveCamera(state, {left, forward, up})
        }

        requestAnimationFrame(pullKeys);
    }

    const onKeyPress = (e: KeyboardEvent) => {
        for (const item of toggles) {
            if (e.key === item.key) {
                item.action();
                setToggleValue(item);
                return;
            }
        }
        pressed.add(e.key);
    }

    const onWheel = (e: WheelEvent) => {
        const {deltaY: dy} = e;
        if (dy) {
            zoom(state, dy / Math.abs(dy) * 10);
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
            rotateCamera(state, -movementX / 500, movementY)
        }
    }

    const onContextMenu = (e: MouseEvent) => {
        e.preventDefault();
    }

    const onTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0]
        if (prevTouch) {
            rotateCamera(
                state,
                (touch.clientX - prevTouch.clientX) / 500,
                prevTouch.clientY - touch.clientY
            )
        }
        prevTouch = touch;
    }
    const onTouchStart = (e: TouchEvent) => {
        prevTouch = null;
    }

    const tearDown = () => {
        elem.removeEventListener('wheel', onWheel);
        elem.removeEventListener('mousedown', onMouseDown)
        elem.removeEventListener('contextmenu', onContextMenu)
        elem.removeEventListener('touchmove', onTouchMove)
        elem.removeEventListener('touchstart', onTouchStart)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('keypress', onKeyPress);
        window.removeEventListener('keyup', onKeyup);
        toggles.forEach(item => {
            const toggle = document.querySelector(`[data-toggle-id=${item.id}]`);
            toggle?.removeEventListener('toggle', item.action)
        })
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
        setToggleValue(item)
        const toggle = document.querySelector(`[data-toggle-id=${item.id}]`);
        toggle?.addEventListener('toggle', item.action)
    })

    return {
        tearDown
    }
}
