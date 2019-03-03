varying highp vec3 vLighting;
varying lowp float shouldClip;
varying lowp vec4 fragmentColor;

const lowp vec4 grassColor = vec4(0.12, 0.43, 0.02, 1.0);
const lowp vec4 snowColor = vec4(0.73, 0.91, 0.92, 1.0);
const lowp vec4 groundColor = vec4(0.85, 0.84, 0.79, 1.00);

void main() {
  if (shouldClip == 1.0) {
    discard;
  }
  lowp float grassSnowMixFactor = pow(fragmentColor.r, 3.0);
  lowp float groundGrassMixFactor = 1.0 - pow(fragmentColor.r, 0.3);
  gl_FragColor = mix(grassColor, snowColor, grassSnowMixFactor);
  gl_FragColor = mix(gl_FragColor, groundColor, groundGrassMixFactor);
}
