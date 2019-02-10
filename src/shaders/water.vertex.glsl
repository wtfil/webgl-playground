attribute vec4 position;
attribute vec2 textureCoord;

uniform mat4 model;
uniform mat4 projection;

varying lowp vec2 vTextureCoord;

void main() {
  gl_Position = projection * model * position;

  vTextureCoord = textureCoord;
}