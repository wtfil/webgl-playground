precision highp float;

attribute vec4 position;
attribute vec2 textureCoord;

uniform mat4 view;
uniform mat4 model;
uniform mat4 projection;
uniform vec3 cameraPosition;

varying vec2 vTextureCoord;
varying vec4 clipSpace;
varying vec3 fromFragmentToCamera;
varying float reflectionYOffset;

const float tiling = 10.0;

void main() {
    vec4 worldPosition = model * position;
    gl_Position = clipSpace = projection * view * worldPosition;

    fromFragmentToCamera = cameraPosition - worldPosition.xyz;
    vTextureCoord = textureCoord * tiling;
}