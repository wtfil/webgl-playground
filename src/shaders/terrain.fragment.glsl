varying highp vec3 vLighting;
varying lowp vec2 vTextureCoord;
varying lowp float shouldClip;

uniform sampler2D texture;

void main() {
  if (shouldClip == 1.0) {
    discard;
  }
  highp vec4 color = texture2D(texture, vTextureCoord);
  gl_FragColor = vec4(color.rgb * vLighting, color.a);
}