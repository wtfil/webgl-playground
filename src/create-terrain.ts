import {vec3 as Vec3} from "gl-matrix";

export async function createTerrain(src: string, maxHeight: number, size: number) {
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
    const levelHeight = 256 / maxHeight;

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
            const v = s / size / size / levelHeight;
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
    const texture = [];

    console.time('position')
    for (let i = 0; i < height; i ++) {
        for (let j = 0; j < width; j++) {
            const k = i * width + j
            const c = heatmap[k] / max;
            position.push(
                i - height / 2,
                j - width / 2,
                heatmap[k]
            );
            colors.push(c, c, c, 1)

            if ((i !== height - 1) && (j !== width - 1)) {
                indices.push(
                    k,
                    k + width,
                    k + 1,
                    k + 1,
                    k + width,
                    k + width + 1,
                );
            }
            texture.push(j / width, i / height);
            
        }
    }
    console.timeEnd('position')

    console.time('normal');
    for (let i = 0; i < position.length / 3; i ++) {
        const w = width;
        const h = height;
        const iw = i % w;
        const ih = ~~(i / w);
        const facesIndexes = [
            iw > 0 && ih > 0 && [
                i - w,
                i - 1,
                i,
            ],
            iw + 1 < w && ih > 0 && [
                i - w,
                i,
                i - w + 1,
            ],
            iw + 1 < w && ih > 0 && [
                i - w + 1,
                i,
                i + 1,
            ],
            iw > 0 && ih < h && [
                i - 1,
                i + w - 1,
                i,
            ],
            iw > 0 && ih < h && [
                i,
                i + w - 1,
                i + w,
            ],
            iw + 1 < w && ih < h && [
                i,
                i + w,
                i + 1,
            ],
        ];
        const faces = [];
        const facesNormals = [];

        for (let j = 0; j < facesIndexes.length; j ++) {
            const f = facesIndexes[j];
            for (let k = 0; k < 3; k ++) {
                if (f) {
                    faces.push(
                        position[f[k] * 3],
                        position[f[k] * 3 + 1],
                        position[f[k] * 3 + 2],
                    )
                }
            }
        }
        for (let j = 0; j < faces.length / 9; j ++) {
            const p1 = Vec3.fromValues(
                faces[j * 9 + 0],
                faces[j * 9 + 1],
                faces[j * 9 + 2]
            );
            const p2 = Vec3.fromValues(
                faces[j * 9 + 3],
                faces[j * 9 + 4],
                faces[j * 9 + 5]
            );
            const p3 = Vec3.fromValues(
                faces[j * 9 + 6],
                faces[j * 9 + 7],
                faces[j * 9 + 8]
            );
            ////
            // U = p2 - p1
            // V = p3 - p1
            // N = U x V
            ////
            Vec3.subtract(p2, p2, p1)
            Vec3.subtract(p3, p3, p1)
            Vec3.cross(p2, p2, p3)
            Vec3.normalize(p2, p2);
            facesNormals.push(p2);
        }

        const n = Vec3.fromValues(0, 0, 0);
        for (let j = 0; j < facesNormals.length; j ++) {
            Vec3.add(n, n, facesNormals[j]);
        }
        Vec3.normalize(n, n);

        normals.push(n[0], n[1], n[2]);
    }
    console.timeEnd('normal');

    return {
        position,
        indices,
        colors,
        normals,
        texture,
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