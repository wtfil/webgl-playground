precision lowp float;

attribute vec4 position;

uniform mat4 view;
uniform mat4 model;
uniform mat4 projection;

varying vec4 worldPosition;

void main() {
    worldPosition = position;
    gl_Position = projection * view * model * worldPosition;
}