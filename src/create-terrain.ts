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

    // const width = 2;
    // const height = 2;
    // const heatmap = [0, 1, 0, 1];

    const position = [];
    const indices = [];
    const colors = [];

    for (let i = 0; i < height; i ++) {
        for (let j = 0; j < width; j++) {
            const k = i * width + j
            //position.push(i, heatmap[k], j)
            position.push(i, j, heatmap[k]);
            const c = (1 + heatmap[k]) / (1 + max);
            //const c = 1;
            colors.push(c, c, c, 1)

            if ((i !== height - 1) && (j !== width - 1)) {
                indices.push(
                    k,
                    k + 1,
                    k + width,
                    k, // why the hell we need this?
                    k + 1,
                    k + width + 1,
                    k + width,
                );
            }
            
        }
    }

    print(heatmap, width);
    // print(position, width);
    console.log({width, height})
    console.log(position)
    console.log(indices)

    return {
        position: new Float32Array(position),
        indices: new Uint16Array(indices),
        colors: new Float32Array(colors)
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


//createTerrain('/heatmap2.jpg', 8, 64);