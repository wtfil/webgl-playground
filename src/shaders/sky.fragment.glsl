// credits https://www.shadertoy.com/view/MsVSWt
precision highp float;

uniform vec3 sunPosition;
varying vec4 worldPosition;

vec3 getSunColor(
    vec3 position,
    vec3 sun
) {
    float dis = 1.0 - distance(sun, position);
    dis = clamp(dis, 0.01, 1.0);
    float z = clamp(sun.z, 0.0, 1.0);
    float z2 = pow(z, 1.5);
    
    float glow = dis;
    
    dis = pow(dis, 100.0);
    dis *= 10.0;
    dis = clamp(dis, 0.0, 1.0);
    
    glow = pow(glow, z * 12.0);
    glow = clamp(glow, 0.0, 1.0);
    
    dis *= pow(z2, 1.0 / 1.65);
    glow *= pow(z2, 1.0 / 2.0);
    
    dis += glow;
    
    return vec3(1.0,0.6,0.05) * dis;
    
}

vec3 getFastScattering(vec3 position, vec3 sun) {
    float atmosphere = sqrt(1.0 - position.z);
    vec3 skyColor = vec3(0.2, 0.4, 0.8);
    float scatter = pow(sun.z, 1.0 / 15.0);
    scatter = 1.0 - clamp(scatter, 0.8, 1.0);
    vec3 scatterColor = mix(
        vec3(1.0),
        vec3(1.0, 0.3, 0.0) * 1.5,
        scatter * 2.0
    );
    skyColor = mix(
        skyColor,
        scatterColor,
        atmosphere / 1.3
    );
    skyColor = mix(skyColor, vec3(0.0), clamp(-sun.z * 3.0, 0.0, 1.0));
    return skyColor;
}

void main() {
    vec3 world = normalize(worldPosition.xyz);
    vec3 sun = normalize(sunPosition);
    vec3 color = vec3(0.0);
    color += getSunColor(world, sun);
    color += getFastScattering(world, sun);

    gl_FragColor = vec4(color, 1.0);
}