varying highp vec3 vLighting;
varying lowp float shouldClip;
varying lowp vec4 fragmentColor;

const lowp vec4 grassColor = vec4(0.12, 0.43, 0.02, 1.0);
const lowp vec4 snowColor = vec4(0.73, 0.91, 0.92, 1.0);
const lowp vec4 groundColor = vec4(0.85, 0.84, 0.79, 1.0);

void main() {
  if (shouldClip == 1.0) {
    discard;
  }
  lowp float x = fragmentColor.x;
  lowp float grassSnowMixFactor = smoothstep(0.7, 0.9, x);
  // lowp float groundGrassMixFactor = (1.0 - smoothstep(0.0, 0.3, x)) * (1.0 - x);
  lowp float groundGrassMixFactor = smoothstep(0.0, 0.3, x);
  lowp vec4 color = mix(grassColor, snowColor, grassSnowMixFactor);
  color = mix(groundColor, color, groundGrassMixFactor);

  gl_FragColor = vec4(color.rgb * vLighting, color.a);
}
