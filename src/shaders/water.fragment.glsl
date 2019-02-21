varying lowp vec2 vTextureCoord;
varying lowp vec4 clipSpace;
varying lowp vec3 fromFragmentToCamera;

uniform sampler2D dudvTexture;
uniform sampler2D normalMapTexture;
uniform sampler2D refractionTexture;
uniform lowp float dudvOffset;

lowp float waterDistortionStrenth = 0.03;
lowp float fresnelStrength = 1.5;

lowp vec4 shallowWaterColor =  vec4(0.0, 0.1, 0.3, 1.0);
lowp vec4 deepWaterColor = vec4(0.0, 0.1, 0.2, 1.0);

void main() {
    lowp vec2 distortedTexCoords = texture2D(dudvTexture, vec2(vTextureCoord.x, vTextureCoord.y + dudvOffset)).xy * 0.1;
    distortedTexCoords = vTextureCoord + vec2(distortedTexCoords.x + dudvOffset, distortedTexCoords.y);

    lowp vec2 totalDistortion = (texture2D(dudvTexture, distortedTexCoords).xy * 2.0 - 1.0) * waterDistortionStrenth;

    lowp vec2 ndc = (clipSpace.xy / clipSpace.w) / 2.0 + 0.5;
    lowp vec2 refractTexCoords = vec2(ndc.x, ndc.y);

    lowp vec3 toCamera = normalize(fromFragmentToCamera);

    lowp vec4 normalMapColor = texture2D(normalMapTexture, distortedTexCoords);
    lowp vec3 normal = vec3(
      normalMapColor.r * 2.0 - 1.0,
      normalMapColor.b * 2.6,
      normalMapColor.g * 2.0 - 1.0
    );
    normal = normalize(normal);

    lowp float refractiveFactor = dot(toCamera, normal);
    refractiveFactor = pow(refractiveFactor, fresnelStrength);

    refractTexCoords += totalDistortion;
    // refractTexCoords = clamp(refractTexCoords, 0.001, 0.999);

    lowp vec4 refractColor = texture2D(refractionTexture, refractTexCoords);
    //lowp vec4 reflectColor = texture2D(reflectionTexture, reflectTexCoords);
    lowp vec4 reflectColor = vec4(0.0, 0.0, 0.0, 0.0);

    gl_FragColor = mix(reflectColor, refractColor, refractiveFactor);
    gl_FragColor = mix(gl_FragColor, shallowWaterColor, 0.2);
}
