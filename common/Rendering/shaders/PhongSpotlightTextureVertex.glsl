#define SPOTLIGHTS_COUNT 12

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

uniform vec3 uLightDirection;
uniform vec3 uSpotlightPositions[SPOTLIGHTS_COUNT];
uniform vec3 uSpotlightDirections[SPOTLIGHTS_COUNT];

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoords;

varying vec2 vTexCoords;

varying vec3 vViewSpaceNormal;
varying vec3 vViewSpaceViewDirection;
varying vec3 vViewSpacePosition;

varying vec3 vViewSpaceLightDirection;
varying vec3 vViewSpaceSpotlightPositions[SPOTLIGHTS_COUNT];
varying vec3 vViewSpaceSpotlightDirections[SPOTLIGHTS_COUNT];

void main(void){
    vec4 vspos = uModelViewMatrix * vec4(aPosition, 1.0);
    gl_Position = uProjectionMatrix * vspos;
    vViewSpaceNormal = normalize(uModelViewMatrix * vec4(aNormal, 0.0)).xyz;
    vViewSpaceViewDirection = -normalize(vspos).xyz;
    vViewSpacePosition = vspos.xyz;

    for(int i = 0; i < SPOTLIGHTS_COUNT; i++){
        vViewSpaceSpotlightPositions[i] = (uViewMatrix * vec4(uSpotlightPositions[i], 1.0)).xyz;
        vViewSpaceSpotlightDirections[i] = (uViewMatrix * vec4(uSpotlightDirections[i], 0.0)).xyz;
    }

    vViewSpaceLightDirection = (uViewMatrix * vec4(uLightDirection, 0.0)).xyz;
    vTexCoords = aTexCoords.xy;
}