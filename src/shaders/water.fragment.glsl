varying lowp vec2 vTextureCoord;

uniform sampler2D texture;
uniform lowp float dudvOffset;

void main() {
  lowp vec2 distortedTexCoords = texture2D(texture, vec2(vTextureCoord.x + dudvOffset, vTextureCoord.y)).rg * 0.1;
  distortedTexCoords = vTextureCoord + vec2(distortedTexCoords.x, distortedTexCoords.y + dudvOffset);

  gl_FragColor = vec4(0, 0, distortedTexCoords * vec2(1, 1));
}