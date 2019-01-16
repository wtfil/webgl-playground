import {vec3 as Vec3} from "gl-matrix";

export async function createTerrain(src: string, levels: number, size: number) {
    const canvas = document.createElement('canvas');
    const image = await loadImage(src);
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }
    ctx.drawImage(image, 0, 0);
    const {data} = ctx.getImageData(0, 0, image.width, image.height);
    const u32 = new Uint32Array(data)
    const levelHeight = 256 / levels;

    const width = Math.floor(image.width / size);
    const height = Math.floor(image.height / size);
    const heatmap = new Float32Array(width * height);
    let max = 0;

    console.time('heatmap')
    for (let i = 0; i < height; i ++) {
        for (let j = 0; j < width; j ++) {
            let s = 0;
            for (let k = 0; k < size; k ++) {
                for (let l = 0; l < size; l ++) {
                    s += u32[(i * size * image.width + j * size + k * size + l) * 4]
                }
            }
            const v = Math.floor(s / size / size / levelHeight);
            heatmap[i * width + j] = v;
            if (max < v) {
                max = v;
            }
        }
    }
    console.timeEnd('heatmap')

    const position = [];
    const indices = [];
    const colors = [];
    const normals = [];

    console.time('indicies')
    for (let i = 0; i < height; i ++) {
        for (let j = 0; j < width; j++) {
            const k = i * width + j
            //const c = (1 + heatmap[k]) / (1 + max);
            const c = 1;
            position.push(i, j, heatmap[k]);
            colors.push(c, c, c, 1)

            //normals.push(1, 1, 1);

            if ((i !== height - 1) && (j !== width - 1)) {
                indices.push(
                    k,
                    k + 1,
                    k + width,
                    k + 1,
                    k + width + 1,
                    k + width,
                );
            }
            
        }
    }
    console.timeEnd('indicies')

    console.time('normals')
    for (let i = 0; i < indices.length / 3; i ++) {
        const i1 = indices[i * 3];
        const i2 = indices[i * 3 + 1];
        const i3 = indices[i * 3 + 2];
        const p1 = Vec3.fromValues(
            position[i1],
            position[i1 + 1],
            position[i1 + 2]
        );
        const p2 = Vec3.fromValues(
            position[i2],
            position[i2 + 1],
            position[i2 + 2]
        );
        const p3 = Vec3.fromValues(
            position[i3],
            position[i3 + 1],
            position[i3 + 2]
        );
        /**
         * U = p2 - p1
         * V = p3 - p1
         * N = U x V
         */
        Vec3.subtract(p2, p2, p1)
        Vec3.subtract(p3, p3, p1)
        Vec3.cross(p2, p2, p3)
        Vec3.normalize(p2, p2);
        normals.push(p2[0], p2[1], p2[2]);
    }
    console.timeEnd('normals')

    return {
        position,
        indices,
        colors,
        normals
    }
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = src;
        image.onload = () => resolve(image);
        image.onerror = reject;
    })
}

function print(arr: any, width: number) {
    const lines = [];
    for (let i = 0; i < arr.length / width; i ++) {
        const line = arr.slice(width * i, width * (i + 1)).join(' ');
        lines.push(line);
    }
    console.log('%c%s', 'font-size: 8px;', lines.join('\n'));
}