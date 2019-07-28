uniform lowp vec3 sunPosition;
uniform lowp float height;
uniform lowp float width;

void main() {
    lowp vec3 fragCoord = vec3(
        gl_FragCoord.x / width,
        gl_FragCoord.y / height,
        gl_FragCoord.z
    );
    lowp float d = distance(sunPosition, fragCoord);
    lowp float f = 1.0 - step(1.0, d);   
    gl_FragColor = vec4(f, f, f, 1.0);
}