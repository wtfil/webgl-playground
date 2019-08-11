uniform lowp float height;
uniform lowp float width;
uniform lowp vec3 sunPosition;

varying lowp vec3 sunViewPosition;

void main() {
    lowp vec2 fragCoord = vec2(
        gl_FragCoord.x / width,
        gl_FragCoord.y / height
    );
    lowp float d = distance(sunViewPosition.xy, fragCoord);
    lowp float scale = 0.1;
    lowp float edge = 0.3;
    if (step(scale, d) == 1.0) {
        gl_FragColor = vec4(0.0);
    } else if (step(scale * edge, d) == 1.0) {
        lowp float alpha = sqrt(1.0 - smoothstep(scale * edge, scale, d));
        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
    } else {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
}