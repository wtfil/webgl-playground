
attribute vec4 position;

uniform mat4 view;
uniform mat4 model;
uniform mat4 projection;

void main() {
    vec4 worldPosition = model * position;
    vec4 direction = normalize(position);
    gl_Position = projection * view * worldPosition;
    gl_Position.z = gl_Position.w; // ??
}