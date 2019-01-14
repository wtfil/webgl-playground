async function createTerrain(src: string, levels: number, size: number) {
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
    const heatmap = new Int32Array(width * height);

    for (let i = 0; i < height; i ++) {
        for (let j = 0; j < width; j ++) {
            let s = 0;
            for (let k = 0; k < size; k ++) {
                for (let l = 0; l < size; l ++) {
                    s += u32[(i * size * image.width + j * size + k * size + l) * 4]
                }
            }
            heatmap[i * width + j] = Math.floor(s / size / size / levelHeight);
        }
    }

    print(heatmap, width);
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = src;
        image.onload = () => resolve(image);
        image.onerror = reject;
    })
}

function print(arr: Int32Array, width: number) {
    const lines = [];
    for (let i = 0; i < arr.length / width - 1; i ++) {
        const line = arr.slice(width * i, width * (i + 1)).join(' ');
        lines.push(line);
    }
    console.log('%c%s', 'font-size: 8px;', lines.join('\n'));
}


createTerrain('/heatmap2.jpg', 8, 4);