varying lowp vec2 vTextureCoord;

uniform sampler2D dudvTexture;
uniform sampler2D refractionTexture;
uniform lowp float dudvOffset;

lowp vec4 shallowWaterColor =  vec4(0.0, 0.1, 0.3, 1.0);
lowp vec4 deepWaterColor = vec4(0.0, 0.1, 0.2, 1.0);

void main() {
  lowp vec2 distortedTexCoords = texture2D(dudvTexture, vec2(vTextureCoord.x + dudvOffset, vTextureCoord.y)).rg * 0.1;
  distortedTexCoords = vTextureCoord + vec2(distortedTexCoords.x, distortedTexCoords.y + dudvOffset);

//   lowp vec4 refractColor = texture2D(refractionTexture, distortedTexCoords);
//   gl_FragColor = mix(refractColor, shallowWaterColor, 0.1);

  gl_FragColor = texture2D(refractionTexture, vTextureCoord);
}