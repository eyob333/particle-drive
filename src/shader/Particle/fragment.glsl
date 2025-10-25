// #include ../includes/remap.glsl

uniform float uTime;
uniform float uSpeed;
uniform vec2 uResolution;
uniform vec3 uColor;

varying float vStrength;

void main(){
    vec2 uv = gl_PointCoord.xy;
    vec3 col = vec3(.0);

    // uv.x += sin(uv.y) * uStrength;
    // uv.y *= 4. * .25 * 4.;
    // uv *= 10.;

    float d =   length(uv - .5);
    d = 1. - smoothstep(.43, .43 + .05, d );
     
    col = mix( col, uColor, d);
    col = mix(  col * .0, col, vStrength);
    // col = vec3(uStrength);

    gl_FragColor = vec4(col, 1.);
    // gl_FragColor = vec4(0.47, 0.33, 0.24, 1.0);
    // gl_FragColor = vec4(1., .0, .0, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}