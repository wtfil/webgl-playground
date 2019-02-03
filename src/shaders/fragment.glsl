varying highp vec3 vLighting;
varying lowp vec2 vTextureCoord;
varying lowp vec4 vVertextColor;

uniform sampler2D uTexture;

void main() {
  highp vec4 color = texture2D(uTexture, vTextureCoord);
  //highp vec4 color = vVertextColor;
  gl_FragColor = vec4(color.rgb * vLighting, color.a);
}