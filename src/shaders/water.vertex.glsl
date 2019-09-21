attribute vec4 position;
attribute vec2 textureCoord;

uniform mat4 view;
uniform mat4 model;
uniform mat4 projection;
uniform lowp vec3 cameraPosition;

varying highp vec2 vTextureCoord;
varying highp vec4 clipSpace;
varying highp vec3 fromFragmentToCamera;
varying lowp float reflectionYOffset;

const lowp float tiling = 10.0;

void main() {
    vec4 worldPosition = model * position;
    gl_Position = clipSpace = projection * view * worldPosition;

    fromFragmentToCamera = cameraPosition - worldPosition.xyz;
    vTextureCoord = textureCoord * tiling;
}