attribute vec4 position;

uniform lowp mat4 view;
uniform lowp mat4 model;
uniform lowp mat4 projection;

varying lowp vec4 worldPosition;

void main() {
    worldPosition = position;
    gl_Position = projection * view * model * worldPosition;
}