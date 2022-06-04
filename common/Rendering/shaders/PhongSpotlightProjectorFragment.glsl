#define SPOTLIGHTS_COUNT 14
#define PROJECTOR_COUNT 2
#define KERNEL_RADIUS 3
#define KERNEL_SIZE (2 * KERNEL_RADIUS + 1)
#define KERNEL_CARD float(KERNEL_SIZE * KERNEL_SIZE)

precision highp float;

uniform vec4 uColor;
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
uniform float uProjectorIntensity[PROJECTOR_COUNT];

uniform sampler2D uShadowMap;
uniform mat4 uLightMatrix;
uniform int uShadowMappingMode;
uniform vec2 uShadowMapSize;

varying vec3 vViewSpaceNormal;
varying vec3 vViewSpaceViewDirection;
varying vec3 vViewSpacePosition;
varying vec4 vPosition;
varying vec3 vViewSpaceLightDirection;


float computePCFLight(sampler2D shadowMap, vec2 shadowMapSize, vec4 lightCoordinates, float bias, float minLight){
    float lightamount = 1.0;
    vec2 delta = 1.0 / shadowMapSize;
    for (int i = 0; i <= KERNEL_SIZE; i++) {
        for (int j = 0; j<= KERNEL_SIZE; j++) {
            vec2 offset = lightCoordinates.xy + vec2(i - KERNEL_RADIUS, j - KERNEL_RADIUS) * delta;
            float shadowDepth = texture2D(shadowMap, offset).z;

            if(shadowDepth - bias < lightCoordinates.z){
                lightamount -= (1.0 - minLight) / KERNEL_CARD;
            }
        }
    }
    return lightamount;
}


void main(void){
    vec3 color = uColor.xyz;

    vec4 lightSpaceCoordinates = uLightMatrix * vPosition;
    lightSpaceCoordinates = lightSpaceCoordinates * 0.5 + 0.5;

    float diffuseLight = max(dot(vViewSpaceLightDirection, vViewSpaceNormal), 0.0) * 0.5 + 0.5;

    vec3 diffuseColor = color * diffuseLight;
    
    vec3 reflectedLightDirection = -vViewSpaceLightDirection + 2.0 * dot(vViewSpaceLightDirection, vViewSpaceNormal) * vViewSpaceNormal;
    float specularLight = pow(max(0.0, dot(vViewSpaceViewDirection, reflectedLightDirection)), uShininess);
    vec3 specularColor = color * specularLight;

    float slopeDependentBias = clamp(0.005 * tan(acos(dot(vViewSpaceNormal, vViewSpaceLightDirection))), 0.00001, 0.01);

    if(uShadowMappingMode == 2){
        float shadowDepth = texture2D(uShadowMap, lightSpaceCoordinates.xy).z;
        if(shadowDepth < lightSpaceCoordinates.z || dot(vViewSpaceNormal, vViewSpaceLightDirection) < 0.0){
            float firstMoment = texture2D(uShadowMap, lightSpaceCoordinates.xy).x;
            float secondMoment = texture2D(uShadowMap, lightSpaceCoordinates.xy).y;
            float variance = secondMoment - (firstMoment * firstMoment);
            float shadow = variance / (variance  + (lightSpaceCoordinates.z - firstMoment)) * 0.5;
            diffuseColor *= shadow + 0.5;
            specularColor *= shadow + 0.5;
        }
    }else if(uShadowMappingMode == 0){
        float shadowDepth = texture2D(uShadowMap, lightSpaceCoordinates.xy).z;
        if(shadowDepth < lightSpaceCoordinates.z - slopeDependentBias || dot(vViewSpaceNormal, vViewSpaceLightDirection) < 0.0){
            diffuseColor *= 0.5;
            specularColor *= 0.0;
        }
    }else if(uShadowMappingMode == 1){
        float lightamount = computePCFLight(uShadowMap, uShadowMapSize, lightSpaceCoordinates, 0.0, 0.5);
        diffuseColor *= lightamount;
        specularColor *= lightamount;
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
        vec4 projectorSpaceCoordinates = uProjectorMatrix[i] * vPosition;
        projectorSpaceCoordinates = projectorSpaceCoordinates / projectorSpaceCoordinates.w;
        projectorSpaceCoordinates = projectorSpaceCoordinates * 0.5 + 0.5;

        if(projectorSpaceCoordinates.x >= 0.0 && projectorSpaceCoordinates.x <= 1.0 && projectorSpaceCoordinates.y >= 0.0 && projectorSpaceCoordinates.y <= 1.0){
            vec4 currentProjectorLight = texture2D(uProjectorSampler[i], projectorSpaceCoordinates.xy);


            if(uShadowMappingMode == 3){
                projectorFinalLight += currentProjectorLight.rgb * currentProjectorLight.a * uProjectorIntensity[i];
            }else{
                float depth = texture2D(uProjectorShadowSampler[i], projectorSpaceCoordinates.xy).z;
                if(depth + 0.005 > projectorSpaceCoordinates.z){
                    projectorFinalLight += currentProjectorLight.rgb * currentProjectorLight.a * uProjectorIntensity[i];
                }
            }
        }

    }

    gl_FragColor = vec4(diffuseColor + specularColor + spotlightColor + projectorFinalLight, 1.0);
}