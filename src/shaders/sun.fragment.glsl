uniform lowp float domeRadius;
uniform lowp vec3 sunPosition;
uniform lowp vec3 cameraPosition;

const lowp float PI = 3.1415926535897932384626433832795;
const lowp float PI_2 = 1.57079632679489661923;
const lowp float si = 22.0; // sun intencity

const lowp float earthRadius = 6371e3;
const lowp float atmosphereRadius = 6471e3;
const lowp float rsh = 8.0e3; // Rayleigh scale height
const lowp float msh = 1.2e3; // Mie scale height

const lowp vec3 rsc = vec3(5.5e-6, 13.0e-6, 22.4e-6); // Rayleigh scattering coefficient
const lowp float msc = 21e-6; // Mie scattering coefficient

const lowp float gr = 0.0; // Rayleigh simetry constant
const lowp float gm = 0.758; // Mie simetry constant

varying lowp vec4 worldPosition;
varying lowp vec4 sunView;

const int samples = 5;

// https://developer.nvidia.com/gpugems/GPUGems2/gpugems2_chapter16.html
lowp float phase(
    lowp float g,
    lowp float a
) {
    lowp float g2 = g * g;
    return 3.0 * (1.0 - g2)  * (1.0 + a * a) / 8.0 / PI / (2.0 + g2) / pow(1.0 + g2 - 2.0 * g * a, 1.5);
}

lowp vec3 translate(lowp vec3 dir) {
    lowp float r1 = earthRadius;
    lowp float r2 = atmosphereRadius;

    lowp float al0 = asin(dir.z);
    lowp float az0 = atan(dir.y / dir.x);
    if (dir.x < 0.0) {
        az0 += PI;
    }
    lowp float al1 = asin(r1 / r2);
    lowp float al2 = al1 + (PI_2 - al1) * (al0 / PI_2);
    return vec3(
        cos(al2) * cos(az0),
        cos(al2) * sin(az0),
        sin(al2)
    );
    // lowp float r3 = sqrt(r2 * r2 - r1 * r1);
    // lowp float a = r3 / r2;
    // return vec3(dir.xy * a, sqrt(1.0 - pow(a * (1.0 - dir.z * dir.z), 2.0)));               
}

// http://viclw17.github.io/2018/07/16/raytracing-ray-sphere-intersection/
lowp float dtse(
    lowp vec3 origin,
    lowp vec3 direction,
    lowp float radius
) {
    lowp vec3 center = vec3(0.0); // could be used as parameter
    lowp vec3 oc = origin - center;
    lowp float a = dot(direction, direction);
    lowp float b = 2.0 * dot(direction, oc);
    lowp float c = dot(oc, oc) - radius * radius;
    lowp float d = b * b - 4.0 * a * c;
    if (d < 0.0) {
        return -1.0;
    }
    lowp float qd = sqrt(d);
    lowp float t = (-qd - b) / 2.0 / a;
    if (t >= 0.0) {
        return t;
    }
    t = (qd - b) / 2.0 / a;
    if (t > 0.0) {
        return t;
    }
    return -1.0;
}

lowp vec3 getSunColor(
    lowp vec3 sun,
    lowp vec3 position
) {
    lowp float angle = acos(dot(
        sun,
        position
    ));
    return vec3(1.0) * (1.0 - smoothstep(0.0, 1.0, angle * 20.0));
}

void main() {
    lowp vec3 camera = vec3(0.0, 0.0, earthRadius);
    lowp vec3 world = normalize(worldPosition.xyz);
    lowp vec3 position = translate(world) * atmosphereRadius;
    lowp vec3 ray = normalize(position - camera);
    lowp vec3 sun = normalize(sunPosition);

    lowp float far = dtse(camera, ray, atmosphereRadius);

    lowp float lightAngle = dot(ray, sun);
    lowp float rshFactor = phase(gr, lightAngle);
    lowp float mieFactor = phase(gm, lightAngle);

    lowp float sampleSize = far / float(samples);
    lowp vec3 samplePoint = camera + ray * sampleSize * 0.5;
    lowp float rshOpticalDepth = 0.0;
    lowp float mieOpticalDepth = 0.0;
    lowp vec3 rshAccumulated = vec3(0.0);
    lowp vec3 mieAccumulated = vec3(0.0);

    for (int i = 0; i < samples; i ++) {
        lowp float far2 = dtse(
            samplePoint,
            sun,
            atmosphereRadius
        );
        lowp float sampleSize2 = far2 / float(samples);
        lowp vec3 samplePoint2 = samplePoint + sampleSize2 / 2.0 * sun;
        lowp float rshOpticalDepth2 = 0.0;
        lowp float mieOpticalDepth2 = 0.0;

        for (int j = 0; j < samples; j ++) {
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
