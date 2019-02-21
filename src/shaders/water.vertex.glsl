attribute vec4 position;
attribute vec2 textureCoord;

uniform mat4 model;
uniform mat4 projection;

varying highp vec2 vTextureCoord;
varying highp vec4 clipSpace;

void main() {
    clipSpace = projection * model * position;
    gl_Position = clipSpace;

    vTextureCoord = textureCoord;
}