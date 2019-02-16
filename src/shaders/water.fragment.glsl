varying lowp vec2 vTextureCoord;
varying lowp vec4 clipSpace;

uniform sampler2D dudvTexture;
uniform sampler2D refractionTexture;
uniform lowp float dudvOffset;

lowp vec4 shallowWaterColor =  vec4(0.0, 0.1, 0.3, 1.0);
lowp vec4 deepWaterColor = vec4(0.0, 0.1, 0.2, 1.0);

void main() {
  lowp vec2 distortedTexCoords = texture2D(dudvTexture, vec2(vTextureCoord.x + dudvOffset, vTextureCoord.y)).rg * 0.1;
  distortedTexCoords = vTextureCoord + vec2(distortedTexCoords.x, distortedTexCoords.y + dudvOffset);

  lowp vec2 totalDistortion = (texture2D(dudvTexture, distortedTexCoords).rg * 2.0 - 1.0) * 0.03;

  //lowp vec2 ndc = (clipSpace.xy / clipSpace.w) / 2.0 + 0.5;
  lowp vec2 ndc = (clipSpace.xy / clipSpace.w) / 2.0 + 0.529;
  lowp vec2 refractTexCoords = vec2(ndc.x, ndc.y);

  refractTexCoords += totalDistortion;

  // lowp vec4 refractColor = texture2D(refractionTexture, distortedTexCoords);
  lowp vec4 refractColor = texture2D(refractionTexture, refractTexCoords);
  gl_FragColor = mix(refractColor, shallowWaterColor, 0.1);
  // gl_FragColor = refractColor;

//  gl_FragColor = texture2D(refractionTexture, vTextureCoord);
}