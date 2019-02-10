varying highp vec3 vLighting;
varying lowp vec2 vTextureCoord;

uniform sampler2D texture;

void main() {
  highp vec4 color = texture2D(texture, vTextureCoord);
  gl_FragColor = vec4(color.rgb * vLighting, color.a);
}