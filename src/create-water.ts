export function createWater(width: number, height: number) {
    const w = width / 2;
    const h = height / 2;
    const position = [
        -w, -h, 0,
        +w, -h, 0,
        -w, +h, 0,
        +w, +h, 0
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
        /*
        0, 0,
        0, 1,
        1, 0,
        1, 1
        */
    ];

    return {position, indices, texture};
}