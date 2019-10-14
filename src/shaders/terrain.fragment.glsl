precision lowp float;

varying vec3 vLighting;
varying float shouldClip;
varying vec4 fragmentColor;

const vec4 grassColor = vec4(0.12, 0.43, 0.02, 1.0);
const vec4 snowColor = vec4(1.0);
const vec4 groundColor = vec4(0.85, 0.84, 0.79, 1.0);

void main() {
  if (shouldClip == 1.0) {
    discard;
  }
  float x = fragmentColor.x;
  float groundGrassMixFactor = smoothstep(0.1, 0.2, x);
  float grassSnowMixFactor = smoothstep(0.7, 0.8, x);
  vec4 color = mix(groundColor, grassColor, groundGrassMixFactor);
  color = mix(color, snowColor, grassSnowMixFactor);

  gl_FragColor = vec4(color.rgb * vLighting, color.a);
}
