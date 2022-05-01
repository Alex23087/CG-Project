precision highp float;
uniform vec4 uColor;
uniform float uShininess;
uniform vec3 uViewSpaceLightDirection;

varying vec3 vViewSpaceNormal;
varying vec3 vViewSpaceViewDirection;

void main(void){
    float diffuseLight = max(dot(uViewSpaceLightDirection, vViewSpaceNormal), 0.0);
    vec3 diffuseColor = uColor.xyz * diffuseLight;
    
    vec3 reflectedLightDirection = -uViewSpaceLightDirection + 2.0 * dot(uViewSpaceLightDirection, vViewSpaceNormal) * vViewSpaceNormal;
    float specularLight = max(0.0, pow(dot(vViewSpaceViewDirection, reflectedLightDirection), uShininess));
    vec3 specularColor = uColor.xyz * specularLight;


    gl_FragColor = vec4(diffuseColor + specularColor, 1.0);
}