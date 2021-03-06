// credits https://github.com/chinedufn/webgl-water-tutorial
precision highp float;

varying vec2 vTextureCoord;
varying vec4 clipSpace;
varying vec3 fromFragmentToCamera;

uniform sampler2D dudvTexture;
uniform sampler2D normalMapTexture;
uniform sampler2D refractionTexture;
uniform sampler2D reflectionTexture;
uniform sampler2D depthTexture;
uniform float dudvOffset;
uniform int useRefraction;
uniform int useReflection;
uniform vec3 directionalLightVector;
uniform vec3 directionalLightColor;

const float waterDistortionStrenth = 0.02;
const float fresnelStrength = 1.00;
const float waterReflectivity = 0.4;
const vec4 shallowWaterColor =  vec4(0.0, 0.1, 0.3, 1.0);
const vec4 deepWaterColor = vec4(0.0, 0.1, 0.2, 1.0);
const float shineDamper = 30.0;

float getDepthAngle(
  vec2 refractTexCoords
) {
    float near = 0.1;
    float far = 50.0;
    float nfp = far + near;
    float nfm = far - near;

    float cameraToFirstThingBehindWater = texture2D(depthTexture, refractTexCoords).r;
    float cameraToFirstThingUnderWater = 2.0 * near * far / (nfp - (2.0 * cameraToFirstThingBehindWater - 1.0) * nfm);
    float cameraToWaterDepth = gl_FragCoord.z;
    float cameraToWaterDistance = 2.0 * near * far / (nfp - (2.0 * cameraToWaterDepth - 1.0) * nfm);
    return cameraToFirstThingUnderWater - cameraToWaterDistance;
}

void main() {
    // distortion
    vec2 distortedTexCoords = texture2D(dudvTexture, vec2(vTextureCoord.x, vTextureCoord.y + dudvOffset)).xy * 0.1;
    distortedTexCoords = vTextureCoord + vec2(distortedTexCoords.x + dudvOffset, distortedTexCoords.y);

    vec2 totalDistortion = (texture2D(dudvTexture, distortedTexCoords).xy * 2.0 - 1.0) * waterDistortionStrenth;

    // base refract/reflect texture coordinates
    vec2 ndc = (clipSpace.xy / clipSpace.w) / 2.0 + 0.5;
    vec2 refractTexCoords = vec2(ndc.x, +ndc.y);
    vec2 reflectTexCoords = vec2(ndc.x, 1.0-ndc.y);
    float angledWaterDepth = getDepthAngle(refractTexCoords);

    // refractive factor
    vec3 toCamera = normalize(fromFragmentToCamera);
    vec4 normalMapColor = texture2D(normalMapTexture, distortedTexCoords);
    vec3 normal = normalMapColor.xyz * 2.0 - 1.0;
    normal = normalize(normal);
    float refractiveFactor = dot(toCamera, normal);
    // TODO do we need this?
    refractiveFactor = pow(refractiveFactor, fresnelStrength);

    // puting all together
    refractTexCoords += totalDistortion;
    reflectTexCoords += totalDistortion;
    refractTexCoords = clamp(refractTexCoords, 0.001, 0.999);
    reflectTexCoords = clamp(reflectTexCoords, 0.001, 0.999);

    // lighs
    vec3 reflectedLight = reflect(normalize(directionalLightVector), normal);
    float specular = max(dot(reflectedLight, toCamera), 0.0);
    specular = pow(specular, shineDamper);
    vec3 specularHighlights = directionalLightColor * specular * waterReflectivity;

    // color
    vec4 refractColor = texture2D(refractionTexture, refractTexCoords);
    vec4 reflectColor = texture2D(reflectionTexture, reflectTexCoords);
    refractColor = mix(refractColor, deepWaterColor, clamp(angledWaterDepth / 10.0, 0.0, 1.0));

    if (useReflection == 1 && useRefraction == 1) {
      gl_FragColor = mix(reflectColor, refractColor, refractiveFactor);
    } else if (useReflection == 1) {
      gl_FragColor = reflectColor;
    } else if (useRefraction == 1) {
      gl_FragColor = refractColor;
    }
    gl_FragColor = mix(gl_FragColor, shallowWaterColor, 0.2);

    gl_FragColor = gl_FragColor + vec4(specularHighlights, 1.0);
}
