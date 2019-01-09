attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying lowp vec4 vColor;

void main() {
  gl_Position = uPMatrix * uMVMatrix * aVertexPosition;
  vColor = aVertexColor;
}

