attribute vec4 position;

uniform lowp vec3 sunPosition;
uniform lowp mat4 view;
uniform lowp mat4 projection;

varying lowp vec3 sunViewPosition;

void main() {
    gl_Position = position;
    mat4 viewZ = mat4(view);
    // viewZ[1] = vec4(1.0);
    // viewZ[1] = vec4(0.0, 1.0, 0.0, 0.0);
    // viewZ[2] = vec4(0.0, 0.0, 1.0, 0.0);
    sunViewPosition = (viewZ * vec4(sunPosition.xy, 1.0, 1.0)).xyz;
}