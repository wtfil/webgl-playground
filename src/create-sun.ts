export function createSun() {
    const position = [];
    const indices = [];
    const R = 1;
    const Z = 0;
    const vertextCount = 100;
    position.push(0, 0, Z);
    for (let i = 0; i < vertextCount; i ++) {
        const a = Math.PI * 2 * i / vertextCount;
        position.push(
            R * Math.cos(a),
            R * Math.sin(a),
            Z
        )
        if (i < vertextCount - 1) {
            indices.push(0, i, i + 1);
        }
    }
    indices.push(0, 1, vertextCount - 1);

    return {position, indices};
}