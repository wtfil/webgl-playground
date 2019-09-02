uniform lowp float domeRadius;
uniform lowp vec3 sunPosition;
uniform lowp vec3 cameraPosition;

const lowp float PI = 3.1415926535897932384626433832795;
const lowp float PI_2 = 1.57079632679489661923;
const lowp float si = 22.0; // sun intencity

const lowp float earthRadius = 6371e3;
const lowp float atmosphereRadius = 6471e3;
const lowp float rsh = 8e3; // Raylish scale height
const lowp float msh = 1.2e3; // Mei scale height

const lowp vec3 rsc = vec3(5.5e-6, 13.0e-6, 22.4e-6); // Raylish scattering coefficient
const lowp float msc = 21e-6; // Mei scattering coefficient

const lowp float gr = 0.0; // Raylish simetry constant
const lowp float gm = -0.75; // Mei simetry constant

varying lowp vec4 worldPosition;
varying lowp vec4 sunView;

const int samples = 15;

// https://developer.nvidia.com/gpugems/GPUGems2/gpugems2_chapter16.html
lowp float phase(
    lowp float g,
    lowp float a
) {
    lowp float g2 = g * g;
    return 3.0 * (1.0 - g2)  * (1.0 + a * a) / 2.0 / (2.0 + g2) / pow(1.0 + g2 - 2.0 * g * a, 1.5);
}

lowp vec3 translate(lowp vec3 dir) {
    lowp float al0 = asin(dir.z);
    lowp float az0 = atan(dir.y / dir.x);
    if (dir.x < 0.0) {
        az0 += PI;
    }
    lowp float r1 = earthRadius;
    lowp float r2 = atmosphereRadius;
    lowp float al1 = asin(r1 / r2);
    lowp float al2 = al1 + (PI_2 - al1) * (al0 / PI_2);
    return vec3(
        cos(al2) * cos(az0),
        cos(al2) * sin(az0),
        sin(al2)
    );
}

void main() {
    lowp float debugMultiplier1 = 1.0e0;
    lowp float debugMultiplier2 = 1.0e0;
    lowp vec3 camera = vec3(0.0, 0.0, earthRadius);
    lowp vec3 sun = sunPosition;
    lowp vec3 position = translate(normalize(worldPosition.xyz)) * atmosphereRadius;
    lowp vec3 ray = normalize(position - camera);
    lowp float far = length(position - camera);
    lowp float lightAngle = dot(normalize(ray), normalize(sun));
    lowp float rshPhase = phase(gr, lightAngle);
    lowp float meiPhase = phase(gm, lightAngle);

    lowp float rshOpticalDepth = 0.0; // optical depth for Raylish phase
    lowp float meiOpticalDepth = 0.0; // optical depth for Mei phase
    lowp float sampleSize = far / float(samples);
    lowp vec3 samplePoint = camera + ray * sampleSize * 0.5;

    for (int i = 0; i < samples; i ++) {
        lowp float height = length(samplePoint) - earthRadius;
        lowp float rshOpticalDepthStep = exp(-height / rsh) * sampleSize;
        lowp float meiOpticalDepthStep = exp(-height / msh) * sampleSize;

        rshOpticalDepth += rshOpticalDepthStep;
        meiOpticalDepth += meiOpticalDepthStep;

        // lowp vec3 attenuate = exp(-rsc * rshOpticalDepth);
        // lowp vec3 attn = exp(-rsc * odr - msc * odm);
        samplePoint += ray * sampleSize;
    }

    lowp vec3 totalScattering = vec3(
        rshPhase * rshOpticalDepth * rsc +
        meiPhase * meiOpticalDepth * msc
    );
    lowp vec3 color = si * exp(-totalScattering * debugMultiplier1) * debugMultiplier2;

    gl_FragColor = vec4(color, 1.0);
}

// const lowp float PI = 3.1415926535897932384626433832795;
// const lowp float PI_2 = 1.57079632679489661923;
// const lowp vec4 daySkyColor = vec4(0.67, 0.96, 0.98, 1.00);
// const lowp vec4 nigthSkyColor = vec4(0.0, 0.0, 0.0, 1.0);
// const lowp vec4 sunColorInner = vec4(0.89, 0.40, 0.00, 1.00);
// const lowp vec4 sunColorOuter = vec4(0.95, 0.77, 0.35, 1.00);
// const lowp float maxSunHeight = 0.2;

// https://www.alanzucconi.com/2017/10/10/atmospheric-scattering-3/
// refractive index of air
// const lowp float  n = 1.00029;
// // the molecular number density of the standard atmosphere. This is the number of molecules per cubic metre;
// const lowp float N = 2.504e25;
// // scale height
// const lowp float H = 8500.0;
// const lowp float rayleighScatteringEquationConstant = pow(PI * (n * n - 1.0), 2.0) / 2.0 / N;
// const lowp float rayleighScatteringCoefficientConstant = 8.0 * pow(PI, 3.0) * pow(n * n - 1.0, 2.0) / 3.0 / N;

// const lowp float lambdaRed = 680.0e-9;
// const lowp float lambdaGreen = 550.0e-9;
// const lowp float lambdaBlue = 440.0e-9;



// lowp float rayleighScatteringEquation(
//     lowp float lambda, // the wavelength of the incoming light;
//     lowp float theta, // the scattering angle;
//     lowp float h // the altitude of the point;
// ) {
//     lowp float p = exp(-h / H);
//     return rayleighScatteringEquationConstant * p / pow(lambda, 4.0) * (1.0 + pow(cos(theta), 2.0));
// }

// lowp float rayleighScatteringCoefficient(
//     lowp float lambda, // the wavelength of the incoming light;
//     lowp float h // the altitude of the point;
// ) {
//     lowp float p = exp(-h / H);
//     return rayleighScatteringCoefficientConstant * p / pow(lambda, 4.0);
// }

/*
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
    lowp float theta = acos(dot(
        normalize(worldPosition.xyz),
        normalize(sunPosition)
    ));
    lowp float r = rayleighScatteringEquation(lambdaRed, theta, H);
    lowp float g = rayleighScatteringEquation(lambdaGreen, theta, H);
    lowp float b = rayleighScatteringEquation(lambdaBlue, theta, H);
    gl_FragColor = vec4(vec3(r, g, b), 1.0);
    gl_FragColor = vec4(0.0);
}
*/