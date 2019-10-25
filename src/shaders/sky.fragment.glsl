precision highp float;

uniform sampler2D cacheTexture;
uniform int useCache;
uniform vec3 sunPosition;
uniform vec3 cameraPosition;

const float PI = 3.1415926535897932384626433832795;
const float PI_2 = 1.57079632679489661923;
const float si = 22.0; // sun intencity

const float earthRadius = 6371e3;
const float atmosphereRadius = 6471e3;
const float rsh = 8.0e3; // Rayleigh scale height
const float msh = 1.2e3; // Mie scale height

const vec3 rsc = vec3(5.5e-6, 13.0e-6, 22.4e-6); // Rayleigh scattering coefficient
const float msc = 21e-6; // Mie scattering coefficient

const float gr = 0.0; // Rayleigh simetry constant
const float gm = 0.758; // Mie simetry constant

varying vec4 worldPosition;
varying vec4 sunView;

const int primaryRaySamples = 3;
const int secondaryRaySamples = 2;

// https://developer.nvidia.com/gpugems/GPUGems2/gpugems2_chapter16.html
float phase(
    float g,
    float a
) {
    float g2 = g * g;
    return 3.0 * (1.0 - g2)  * (1.0 + a * a) / 8.0 / PI / (2.0 + g2) / pow(1.0 + g2 - 2.0 * g * a, 1.5);
}

vec3 translate(vec3 dir) {
    float r1 = earthRadius;
    float r2 = atmosphereRadius;

    float al0 = asin(dir.z);
    float az0 = atan(dir.y / dir.x);
    if (dir.x < 0.0) {
        az0 += PI;
    }
    float al1 = asin(r1 / r2);
    float al2 = al1 + (1.0 - al1 / PI_2) * al0;
    return vec3(
        cos(al2) * cos(az0),
        cos(al2) * sin(az0),
        sin(al2)
    );
}

// http://viclw17.github.io/2018/07/16/raytracing-ray-sphere-intersection/
float dtse(
    vec3 origin,
    vec3 direction,
    float radius
) {
    vec3 center = vec3(0.0); // could be used as parameter
    vec3 oc = origin - center;
    float a = dot(direction, direction);
    float b = 2.0 * dot(direction, oc);
    float c = dot(oc, oc) - radius * radius;
    float d = b * b - 4.0 * a * c;
    if (d < 0.0) {
        return -1.0;
    }
    float qd = sqrt(d);
    float t = (-qd - b) / 2.0 / a;
    if (t >= 0.0) {
        return t;
    }
    t = (qd - b) / 2.0 / a;
    if (t > 0.0) {
        return t;
    }
    return -1.0;
}

vec3 getSunColor(
    vec3 sun,
    vec3 position
) {
    float angle = acos(dot(
        sun,
        position
    ));
    return vec3(1.0) * (1.0 - smoothstep(0.0, 1.0, angle * 20.0));
}

void main() {
    vec3 camera = vec3(0.0, 0.0, earthRadius);
    vec3 world = normalize(worldPosition.xyz);
    vec3 position = translate(world) * atmosphereRadius;
    vec3 ray = normalize(position - camera);
    vec3 sun = normalize(sunPosition);

    float far = dtse(camera, ray, atmosphereRadius);

    float lightAngle = dot(ray, sun);
    float rshFactor = phase(gr, lightAngle);
    float mieFactor = phase(gm, lightAngle);

    float sampleSize = far / float(primaryRaySamples);
    vec3 samplePoint = camera + ray * sampleSize * 0.5;
    float rshOpticalDepth = 0.0;
    float mieOpticalDepth = 0.0;
    vec3 rshAccumulated = vec3(0.0);
    vec3 mieAccumulated = vec3(0.0);

    for (int i = 0; i < primaryRaySamples; i ++) {
        lowp float far2 = dtse(
            samplePoint,
            sun,
            atmosphereRadius
        );
        lowp float sampleSize2 = far2 / float(secondaryRaySamples);
        lowp vec3 samplePoint2 = samplePoint + sampleSize2 / 2.0 * sun;
        lowp float rshOpticalDepth2 = 0.0;
        lowp float mieOpticalDepth2 = 0.0;

        for (int j = 0; j < secondaryRaySamples; j ++) {
            lowp float height = length(samplePoint2) - earthRadius;
            lowp float rshOpticalDepthStep = exp(-height / rsh) * sampleSize2;
            lowp float mieOpticalDepthStep = exp(-height / msh) * sampleSize2;

            rshOpticalDepth2 += rshOpticalDepthStep;
            mieOpticalDepth2 += mieOpticalDepthStep;

            samplePoint2 += sun * sampleSize2;
        }

        lowp float height = length(samplePoint) - earthRadius;
        lowp float rshOpticalDepthStep = exp(-height / rsh) * sampleSize;
        lowp float mieOpticalDepthStep = exp(-height / msh) * sampleSize;

        rshOpticalDepth += rshOpticalDepthStep;
        mieOpticalDepth += mieOpticalDepthStep;

        lowp vec3 outScattering = exp(
            -rsc * (rshOpticalDepth + rshOpticalDepth2)
            -msc * (mieOpticalDepth + mieOpticalDepth2)
        );

        rshAccumulated += rshOpticalDepthStep * outScattering;
        mieAccumulated += mieOpticalDepthStep * outScattering;

        samplePoint += ray * sampleSize;
    }

    lowp vec3 color = vec3(0.0);

    // mieAccumulated *= 0.0;
    // rshAccumulated *= 0.5;
    lowp vec3 sunColor = getSunColor(sun, world);
    lowp vec3 totalLight = si * (
        rshFactor * rsc * rshAccumulated +
        mieFactor * msc * mieAccumulated
    );
    // color += totalLight;
    color += 1.0 - exp(-1.0 * totalLight);
    color += sunColor;

    gl_FragColor = vec4(color, 1.0);
}
