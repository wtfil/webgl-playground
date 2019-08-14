attribute vec4 position;

uniform lowp mat4 view;
uniform lowp mat4 model;
uniform lowp mat4 projection;

void main() {
    gl_Position = projection * view * model * position;
}