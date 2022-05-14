#define SPOTLIGHTS_COUNT 14
precision highp float;

uniform sampler2D uSampler;
uniform float uShininess;

uniform mat4 uViewMatrix;
uniform vec3 uSpotlightPositions[SPOTLIGHTS_COUNT];
uniform vec3 uSpotlightDirections[SPOTLIGHTS_COUNT];
uniform float uSpotlightAttenuation[SPOTLIGHTS_COUNT];
uniform float uSpotlightCutoff[SPOTLIGHTS_COUNT];
uniform vec3 uSpotlightColors[SPOTLIGHTS_COUNT];
uniform float uSpotlightFocus[SPOTLIGHTS_COUNT];
uniform float uSpotlightIntensity[SPOTLIGHTS_COUNT];

varying vec3 vViewSpaceNormal;
varying vec3 vViewSpaceViewDirection;
varying vec3 vViewSpacePosition;
varying vec2 vTexCoords;

varying vec3 vViewSpaceLightDirection;

void main(void){
    vec3 color = texture2D(uSampler, vTexCoords).xyz;
    float diffuseLight = max(dot(vViewSpaceLightDirection, vViewSpaceNormal), 0.0) * 0.5 + 0.5;
    vec3 diffuseColor = color * diffuseLight;
    
    vec3 reflectedLightDirection = -vViewSpaceLightDirection + 2.0 * dot(vViewSpaceLightDirection, vViewSpaceNormal) * vViewSpaceNormal;
    float specularLight = pow(max(0.0, dot(vViewSpaceViewDirection, reflectedLightDirection)), uShininess);
    vec3 specularColor = color * specularLight;

    vec3 spotlightColor = vec3(0.0, 0.0, 0.0);
    for(int i = 0; i < SPOTLIGHTS_COUNT; i++){
        float cosangle = dot(normalize(vViewSpacePosition - (uViewMatrix * vec4(uSpotlightPositions[i], 1.0)).xyz), (uViewMatrix * vec4(uSpotlightDirections[i], 0.0)).xyz);

        vec3 tmpColor = uSpotlightColors[i] * uSpotlightIntensity[i] * pow(max(0.0, cosangle), uSpotlightFocus[i]);
        if(cosangle < uSpotlightCutoff[i]){
            tmpColor *= uSpotlightAttenuation[i];
        }
        
        spotlightColor += tmpColor;
    }

    gl_FragColor = vec4(diffuseColor + specularColor + spotlightColor, 1.0);
}