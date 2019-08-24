attribute vec4 position;
attribute vec3 normal;
attribute vec4 colors;

uniform mat4 view;
uniform mat4 model;
uniform mat4 projection;
uniform vec3 directionalLightVector;
uniform float clipDirection;
uniform float clipLevel;

varying highp vec3 vLighting;
varying lowp vec2 vTextureCoord;
varying lowp vec4 fragmentColor;
varying float shouldClip;

void main() {
  // light
  //highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
  highp vec3 ambientLight = vec3(0, 0, 0);
  highp vec3 directionalLightColor = vec3(1, 1, 1);
  highp vec3 directionalVector = normalize(directionalLightVector);

  highp vec4 transformedNormal = vec4(normal, 1.0);
  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
  vLighting = ambientLight + (directionalLightColor * directional);

  gl_Position = projection * view * model * position;

  fragmentColor = colors;
  if (clipDirection == 1.0) {
    shouldClip = position.z > clipLevel ? 1.0 : 0.0;
  } else if (clipDirection == -1.0) {
    shouldClip = position.z < clipLevel ? 1.0 : 0.0;
  } else {
    shouldClip = 0.0;
  }
}