#define SPOTLIGHTS_COUNT 12
precision highp float;

uniform vec4 uColor;
uniform float uShininess;

uniform float uSpotlightAttenuation[SPOTLIGHTS_COUNT];
uniform float uSpotlightCutoff[SPOTLIGHTS_COUNT];
uniform vec3 uSpotlightColors[SPOTLIGHTS_COUNT];
uniform vec3 uSpotlightPositions[SPOTLIGHTS_COUNT];
uniform float uSpotlightFocus[SPOTLIGHTS_COUNT];
uniform float uSpotlightIntensity[SPOTLIGHTS_COUNT];

varying vec3 vViewSpaceNormal;
varying vec3 vViewSpaceViewDirection;
varying vec3 vViewSpacePosition;

varying vec3 vViewSpaceLightDirection;

varying vec3 vViewSpaceSpotlightPositions[SPOTLIGHTS_COUNT];
varying vec3 vViewSpaceSpotlightDirections[SPOTLIGHTS_COUNT];

void main(void){
    float diffuseLight = max(dot(vViewSpaceLightDirection, vViewSpaceNormal), 0.0) * 0.5 + 0.5;
    vec3 diffuseColor = uColor.xyz * diffuseLight;
    
    vec3 reflectedLightDirection = -vViewSpaceLightDirection + 2.0 * dot(vViewSpaceLightDirection, vViewSpaceNormal) * vViewSpaceNormal;
    float specularLight = max(0.0, pow(dot(vViewSpaceViewDirection, reflectedLightDirection), uShininess));
    vec3 specularColor = uColor.xyz * specularLight;

    vec3 spotlightColor = vec3(0.0, 0.0, 0.0);
    for(int i = 0; i < SPOTLIGHTS_COUNT; i++){
        float cosangle = dot(normalize(vViewSpacePosition - vViewSpaceSpotlightPositions[i]), vViewSpaceSpotlightDirections[i]);

        vec3 tmpColor = uSpotlightColors[i] * max(uSpotlightIntensity[i] * pow(cosangle, uSpotlightFocus[i]), 0.0);
        if(cosangle < uSpotlightCutoff[i]){
            tmpColor *= uSpotlightAttenuation[i];
        }
        
        spotlightColor += tmpColor;
    }

    gl_FragColor = vec4(diffuseColor + specularColor + spotlightColor, 1.0);
}