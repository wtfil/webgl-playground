attribute vec4 position;

uniform lowp vec3 sunPosition;
uniform lowp mat4 view;

void main() {
    gl_Position = vec4(position);
}