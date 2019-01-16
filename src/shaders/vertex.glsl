attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uNMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec3 uDirectionalLightVector;

varying lowp vec4 vColor;
varying highp vec3 vLighting;
varying lowp vec2 vTextureCoord;

void main() {
  // light
  highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
  highp vec3 directionalLightColor = vec3(1, 1, 1);
  highp vec3 directionalVector = normalize(uDirectionalLightVector);

  highp vec4 transformedNormal = uNMatrix * vec4(aVertexNormal, 1.0);
  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
  vLighting = ambientLight + (directionalLightColor * directional);

  // position
  gl_Position = uPMatrix * uMVMatrix * aVertexPosition;

  // color
  vColor = aVertexColor;
  vTextureCoord = aTextureCoord;
}