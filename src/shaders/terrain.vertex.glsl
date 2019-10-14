precision lowp float;

attribute vec4 position;
attribute vec3 normal;
attribute vec4 colors;

uniform mat4 view;
uniform mat4 model;
uniform mat4 projection;
uniform vec3 directionalLightVector;
uniform vec3 directionalLightColor;
uniform float clipDirection;
uniform float clipLevel;

varying vec3 vLighting;
varying vec2 vTextureCoord;
varying vec4 fragmentColor;
varying float shouldClip;

void main() {
  vec3 ambientLight = vec3(0.1, 0.1, 0.1);
  vec3 directionalVector = normalize(directionalLightVector);

  float directional = max(dot(normal, directionalVector), 0.0);
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