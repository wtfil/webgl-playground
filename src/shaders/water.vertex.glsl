attribute vec4 position;
attribute vec2 textureCoord;

uniform mat4 model;
uniform mat4 projection;
uniform vec3 cameraPosition;

varying highp vec2 vTextureCoord;
varying highp vec4 clipSpace;
varying highp vec3 fromFragmentToCamera;

const lowp float tiling = 10.0;

void main() {
    clipSpace = projection * model * position;
    gl_Position = clipSpace;

    fromFragmentToCamera = cameraPosition - (model * position).xyz;
    vTextureCoord = textureCoord * tiling;
}