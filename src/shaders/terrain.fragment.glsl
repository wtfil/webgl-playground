varying highp vec3 vLighting;
varying highp float shouldClip;
varying lowp vec4 fragmentColor;

const lowp vec4 nothingColor = vec4(0.0, 0.0, 0.0, 0.0);
const lowp vec4 grassColor = vec4(0.12, 0.43, 0.02, 1.0);
const lowp vec4 snowColor = vec4(1.0);
const lowp vec4 groundColor = vec4(0.85, 0.84, 0.79, 1.0);

void main() {
  if (shouldClip == 1.0) {
    discard;
  }
  lowp float x = fragmentColor.x;
  lowp float groundGrassMixFactor = smoothstep(0.1, 0.2, x);
  lowp float grassSnowMixFactor = smoothstep(0.7, 0.8, x);
  lowp float nothingGroundMixFactor = smoothstep(0.01, 0.015, x);
  lowp vec4 color = mix(groundColor, grassColor, groundGrassMixFactor);
  color = mix(color, snowColor, grassSnowMixFactor);
  color = mix(nothingColor, color, nothingGroundMixFactor);

  gl_FragColor = vec4(color.rgb * vLighting, color.a);
}
