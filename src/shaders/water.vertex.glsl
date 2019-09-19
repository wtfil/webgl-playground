attribute vec4 position;
attribute vec2 textureCoord;

uniform mat4 view;
uniform mat4 model;
uniform mat4 projection;
// uniform lowp float size;
uniform lowp vec3 cameraPosition;
// uniform lowp vec3 center;

varying highp vec2 vTextureCoord;
varying highp vec4 clipSpace;
varying highp vec3 fromFragmentToCamera;
varying lowp float reflectionYOffset;

const lowp float tiling = 10.0;

void main() {
    vec4 worldPosition = model * vec4(position.xy, 0.0, 1.0);
    gl_Position = clipSpace = projection * view * worldPosition;

    fromFragmentToCamera = cameraPosition - worldPosition.xyz;
    vTextureCoord = textureCoord * tiling;

    // reflectionYOffset = dot(center, cameraPosition - center) / size;
}