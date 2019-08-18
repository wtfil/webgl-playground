uniform lowp float domeRadius;
uniform lowp vec3 sunPosition;

varying lowp vec4 worldPosition;

const lowp float PI = 3.1415926535897932384626433832795;
const lowp float PI_2 = 1.57079632679489661923;
const lowp vec4 daySkyColor = vec4(0.67, 0.96, 0.98, 1.00);
const lowp vec4 nigthSkyColor = vec4(0.0, 0.0, 0.0, 1.0);
const lowp vec4 sunColorInner = vec4(0.89, 0.40, 0.00, 1.00);
const lowp vec4 sunColorOuter = vec4(0.95, 0.77, 0.35, 1.00);
const lowp float maxSunHeight = 0.2;


void main() {
    lowp float sunSize = 150.0;
    lowp float sunToFragment = distance(sunPosition * domeRadius, worldPosition.xyz);
    lowp float colorFactor = smoothstep(0.0, sunSize, pow(sunToFragment, 1.0));
    lowp float alpha = 0.5 - atan((sunToFragment - sunSize) / domeRadius * 10.0) / PI;
    lowp vec4 skyColor = mix(
        daySkyColor,
        nigthSkyColor,
        smoothstep(maxSunHeight, -maxSunHeight, sunPosition.z)
    );

    lowp vec4 sunColor = mix(sunColorInner, sunColorOuter, colorFactor);
    gl_FragColor = mix(skyColor, sunColor, alpha);
}