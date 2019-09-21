varying lowp vec2 vTextureCoord;
varying lowp vec4 clipSpace;
varying lowp vec3 fromFragmentToCamera;

uniform sampler2D dudvTexture;
uniform sampler2D normalMapTexture;
uniform sampler2D refractionTexture;
uniform sampler2D reflectionTexture;
uniform lowp float dudvOffset;
uniform int useRefraction;
uniform int useReflection;
uniform lowp vec3 directionalLightVector;

const lowp float waterDistortionStrenth = 0.03;
const lowp float fresnelStrength = 1.5;
const lowp float waterReflectivity = 0.5;
const lowp vec3 sunlightColor = vec3(1.0, 1.0, 1.0);
const lowp vec4 shallowWaterColor =  vec4(0.0, 0.1, 0.3, 1.0);
// const lowp vec4 deepWaterColor = vec4(0.0, 0.1, 0.2, 1.0);
const lowp float shineDamper = 20.0;

void main() {
    // distortion
    lowp vec2 distortedTexCoords = texture2D(dudvTexture, vec2(vTextureCoord.x, vTextureCoord.y + dudvOffset)).xy * 0.1;
    distortedTexCoords = vTextureCoord + vec2(distortedTexCoords.x + dudvOffset, distortedTexCoords.y);

    lowp vec2 totalDistortion = (texture2D(dudvTexture, distortedTexCoords).xy * 2.0 - 1.0) * waterDistortionStrenth;

    // base refract/reflect texture coordinates
    lowp vec2 ndc = (clipSpace.xy / clipSpace.w) / 2.0 + 0.5;
    lowp vec2 refractTexCoords = vec2(ndc.x, +ndc.y);
    lowp vec2 reflectTexCoords = vec2(ndc.x, 1.0-ndc.y);


    // refractive factor
    lowp vec3 toCamera = normalize(fromFragmentToCamera);
    lowp vec4 normalMapColor = texture2D(normalMapTexture, distortedTexCoords);
    lowp vec3 normal = normalMapColor.xyz * 2.0 - 1.0;
    normal = normalize(normal);
    lowp float refractiveFactor = dot(toCamera, normal);
    refractiveFactor = pow(refractiveFactor, fresnelStrength);

    // puting all together
    refractTexCoords += totalDistortion;
    reflectTexCoords += totalDistortion;
    // refractTexCoords = clamp(refractTexCoords, 0.001, 0.999);
    // reflectTexCoords.x = clamp(reflectTexCoords.x, 0.001, 0.999);
    // reflectTexCoords.y = clamp(reflectTexCoords.y, 0.001, 0.999);

    // lighs
    lowp vec3 reflectedLight = reflect(normalize(directionalLightVector), normal);
    lowp float specular = max(dot(reflectedLight, toCamera), 0.0);
    specular = pow(specular, shineDamper);
    lowp vec3 specularHighlights = sunlightColor * specular * waterReflectivity;

    // color
    lowp vec4 refractColor = texture2D(refractionTexture, refractTexCoords);
    lowp vec4 reflectColor = texture2D(reflectionTexture, reflectTexCoords);

    if (useReflection == 1 && useRefraction == 1) {
      gl_FragColor = mix(reflectColor, refractColor, refractiveFactor);
    } else if (useReflection == 1) {
      gl_FragColor = reflectColor;
    } else if (useRefraction == 1) {
      gl_FragColor = refractColor;
    }
    gl_FragColor = mix(gl_FragColor, shallowWaterColor, 0.2);

    gl_FragColor = gl_FragColor + vec4(specularHighlights, 0.0);
}
