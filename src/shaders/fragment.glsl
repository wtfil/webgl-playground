varying lowp vec4 vColor;
varying highp vec3 vLighting;

void main() {
  //gl_FragColor = vec4(vColor.rgb * vLighting, vColor.a);
  gl_FragColor = vColor;
}