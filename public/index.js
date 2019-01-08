window.addEventListener('load', setup);

async function loadShader(url) {
    const res = await fetch('/shaders/' + url);
    const src = await res.text();
    return src;
}

async function setup() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    document.body.appendChild(canvas);

    let source = await loadShader('vertex.glsl')
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, source);
    gl.compileShader(vertexShader);

    source = await loadShader('fragment.glsl')
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, source);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader)
    initializeAttributes(gl);
    gl.useProgram(program);
    gl.drawArrays(gl.POINTS, 0, 1);
}

function initializeAttributes(gl) {
    const buffer = gl.createBuffer();
    gl.enableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
  }