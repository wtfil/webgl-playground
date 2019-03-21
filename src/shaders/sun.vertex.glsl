
attribute vec4 position;

uniform mat4 model;
uniform mat4 projection;

void main() {
    gl_Position = projection * model * position;
}