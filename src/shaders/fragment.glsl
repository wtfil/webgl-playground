varying lowp vec4 vColor;
varying highp vec3 vLighting;
varying lowp vec2 vTextureCoord;

uniform sampler2D uTexture;

void main() {
  //lowp vec4 color = texture2D(uTexture, vTextureCoord);
  gl_FragColor = vec4(vColor.rgb * vLighting, vColor.a);
}