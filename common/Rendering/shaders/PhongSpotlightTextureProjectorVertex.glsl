uniform mat4 uModelViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

uniform vec3 uLightDirection;

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoords;

varying vec2 vTexCoords;

varying vec3 vViewSpaceNormal;
varying vec3 vViewSpaceViewDirection;
varying vec3 vViewSpacePosition;

varying vec3 vViewSpaceLightDirection;
varying vec4 vPosition;

void main(void){
    vec4 vspos = uModelViewMatrix * vec4(aPosition, 1.0);
    gl_Position = uProjectionMatrix * vspos;
    vViewSpaceNormal = normalize(uModelViewMatrix * vec4(aNormal, 0.0)).xyz;
    vViewSpaceViewDirection = -normalize(vspos).xyz;
    vViewSpacePosition = vspos.xyz;

    vViewSpaceLightDirection = normalize(uViewMatrix * vec4(uLightDirection, 0.0)).xyz;
    vTexCoords = aTexCoords.xy;
    vPosition = uModelMatrix * vec4(aPosition, 1.0);
}