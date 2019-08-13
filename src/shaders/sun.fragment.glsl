uniform lowp float height;
uniform lowp float width;
uniform lowp vec3 sunPosition;

const lowp float PI = 3.1415926535897932384626433832795;
const lowp float PI_2 = 1.57079632679489661923;
const lowp vec4 skyColor = vec4(0.67, 0.96, 0.98, 1.00);
const lowp vec4 sunColorInner = vec4(0.89, 0.40, 0.00, 1.00);
const lowp vec4 sunColorOuter = vec4(0.95, 0.77, 0.35, 1.00);

void main() {
    lowp vec2 fragCoord = vec2(
        gl_FragCoord.x / width,
        gl_FragCoord.y / height
    );
    highp float sunSize = 0.1;
    highp float sunToFragment = distance(sunPosition.xy, fragCoord);
    highp float colorFactor = smoothstep(0.0, sunSize, pow(sunToFragment, 1.0));
    highp float alpha = 0.5 - atan((sunToFragment - sunSize) * 10.0) / PI;
    if (fragCoord.y < 0.5) {
        alpha = 0.0;
    }
    lowp vec4 sunColor = mix(sunColorInner, sunColorOuter, colorFactor);

    gl_FragColor = mix(skyColor, sunColor, alpha);
}