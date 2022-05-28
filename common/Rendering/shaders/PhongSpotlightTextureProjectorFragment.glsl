#define SPOTLIGHTS_COUNT 14
#define PROJECTOR_COUNT 2
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

uniform mat4 uProjectorMatrix[PROJECTOR_COUNT];
uniform sampler2D uProjectorSampler[PROJECTOR_COUNT];
uniform sampler2D uProjectorShadowSampler[PROJECTOR_COUNT];

uniform sampler2D uShadowMap;
uniform mat4 uLightMatrix;

varying vec3 vViewSpaceNormal;
varying vec3 vViewSpaceViewDirection;
varying vec3 vViewSpacePosition;
varying vec2 vTexCoords;
varying vec4 vPosition;
varying vec3 vViewSpaceLightDirection;

void main(void){
    vec3 color = texture2D(uSampler, vTexCoords).xyz;

    vec4 lightSpaceCoordinates = uLightMatrix * vPosition;
    float shadowDepth = texture2D(uShadowMap, lightSpaceCoordinates.xy * 0.5 + 0.5).z;

    float diffuseLight = max(dot(vViewSpaceLightDirection, vViewSpaceNormal), 0.0) * 0.5 + 0.5;

    vec3 diffuseColor = color * diffuseLight;
    
    vec3 reflectedLightDirection = -vViewSpaceLightDirection + 2.0 * dot(vViewSpaceLightDirection, vViewSpaceNormal) * vViewSpaceNormal;
    float specularLight = pow(max(0.0, dot(vViewSpaceViewDirection, reflectedLightDirection)), uShininess);
    vec3 specularColor = color * specularLight;


    float bias = clamp(0.005 * tan(acos(dot(vViewSpaceNormal, vViewSpaceLightDirection))), 0.00001, 0.01);
    if(shadowDepth < lightSpaceCoordinates.z * 0.5 + 0.5 - bias){
        diffuseColor *= 0.5;
        specularColor *= 0.0;
    }

    vec3 spotlightColor = vec3(0.0, 0.0, 0.0);
    for(int i = 0; i < SPOTLIGHTS_COUNT; i++){
        float cosangle = dot(normalize(vViewSpacePosition - (uViewMatrix * vec4(uSpotlightPositions[i], 1.0)).xyz), (uViewMatrix * vec4(uSpotlightDirections[i], 0.0)).xyz);

        vec3 tmpColor = uSpotlightColors[i] * uSpotlightIntensity[i] * pow(max(0.0, cosangle), uSpotlightFocus[i]);
        if(cosangle < uSpotlightCutoff[i]){
            tmpColor *= uSpotlightAttenuation[i];
        }
        
        spotlightColor += tmpColor;
    }


    vec3 projectorFinalLight = vec3(0.0, 0.0, 0.0);
    for(int i = 0; i < PROJECTOR_COUNT; i++){
        vec4 projectorSpaceCoordinates = (uProjectorMatrix[i] * vPosition);
        projectorSpaceCoordinates = projectorSpaceCoordinates / projectorSpaceCoordinates.w;
        projectorSpaceCoordinates += vec4(0.5, 0.0, 0.0, 0.0);
        if(projectorSpaceCoordinates.x >= 0.0 && projectorSpaceCoordinates.x <= 1.0 && projectorSpaceCoordinates.y >= 0.0 && projectorSpaceCoordinates.y <= 1.0){
            vec4 currentProjectorLight = texture2D(uProjectorSampler[i], projectorSpaceCoordinates.xy);

            float depth = texture2D(uProjectorShadowSampler[i], projectorSpaceCoordinates.xy).z;
            if(depth > projectorSpaceCoordinates.z){
                projectorFinalLight += currentProjectorLight.rgb * currentProjectorLight.a;
            }
        }
    }

    gl_FragColor = vec4(diffuseColor + specularColor + spotlightColor + projectorFinalLight, 1.0);
    //gl_FragColor = vec4(texture2D(uShadowMap, lightSpaceCoordinates.xy * 0.5 + 0.5).z - lightSpaceCoordinates.z * 0.5 + 0.5, 0.0, 0.0, 1.0);
    //gl_FragColor = lightSpaceCoordinates * 0.5, + 0.5;
}