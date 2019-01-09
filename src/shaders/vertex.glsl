#version 100
attribute vec4 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main() {
  // gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  // gl_PointSize = 64.0;
  gl_Position = uMVMatrix * uPMatrix * aVertexPosition;
}