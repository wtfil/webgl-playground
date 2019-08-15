attribute vec4 position;

uniform lowp mat4 view;
uniform lowp mat4 model;
uniform lowp mat4 projection;

varying lowp vec4 worldPosition;

void main() {
    worldPosition = model * position;
    gl_Position = projection * view * worldPosition;
}