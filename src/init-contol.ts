export function initControls(canvas: HTMLElement) {
    const ee = new EventTarget();
    const s = 400 / Math.hypot(canvas.clientHeight, canvas.clientWidth);
    const pressed: {[key: string]: boolean} = {};
    const onChange = (detail: any) => {
        ee.dispatchEvent(new CustomEvent('change', {detail}))
    }
    const pullKeys = () => {
        let dx = 0;
        let dy = 0;
        let dz = 0;
        let rx = 0;
        let ry = 0;
        let rz = 0;
        let dl = 0;

        if (pressed.w) {
            dy = s;
        } else if (pressed.s) {
            dy = -s;
        }

        if (pressed.e) {
            dz = s
        } else if (pressed.q) {
            dz = -s
        }

        if (pressed.a) {
            dx = -s;
        } else if (pressed.d) {
            dx = s;
        }

        if (pressed.j) {
            ry = -s * 3;
        } else if (pressed.k) {
            ry = s * 3;
        }
        // if (pressed.h) {
        //     rx = -s * 3;
        // } else if (pressed.l) {
        //     rx = s * 3;
        // }
        if (pressed['[']) {
            dl = s / 400;
        } else if (pressed[']']) {
            dl = -s / 400;
        }

        if (dx || dy || dz || rx || ry || rz || dl) {
            onChange({dx, dy, dz, rx, ry, rz, dl})
        }
        requestAnimationFrame(pullKeys);
    }
    pullKeys();

    window.addEventListener('keypress', e => {
        pressed[e.key] = true;
    })
    window.addEventListener('keyup', e => {
        pressed[e.key] = false;
    })
    return ee;
}