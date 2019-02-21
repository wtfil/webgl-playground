attribute vec4 position;
attribute vec2 textureCoord;

uniform mat4 model;
uniform mat4 projection;
uniform vec3 cameraPosition;

varying highp vec2 vTextureCoord;
varying highp vec4 clipSpace;
varying highp vec3 fromFragmentToCamera;

void main() {
    clipSpace = projection * model * position;
    gl_Position = clipSpace;

    vTextureCoord = textureCoord;
    fromFragmentToCamera = cameraPosition - (model * position).xyz;
}