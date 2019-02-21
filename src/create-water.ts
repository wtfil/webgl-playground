export function createWater() {
    const position = [
        -0.5, -0.5, 0,
        +0.5, -0.5, 0,
        -0.5, +0.5, 0,
        +0.5, +0.5, 0,
    ];
    const indices = [
        0, 2, 1,
        1, 2, 3
    ];
    const texture = [
        0, 0,
        1, 0,
        0, 1,
        1, 1
    ];

    return {position, indices, texture};
}