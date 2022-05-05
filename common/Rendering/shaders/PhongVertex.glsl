uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uViewSpaceLightDirection;

attribute vec3 aPosition;
attribute vec3 aNormal;

varying vec3 vViewSpaceNormal;
varying vec3 vViewSpaceViewDirection;


void main(void){
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    vViewSpaceNormal = normalize(uModelViewMatrix * vec4(aNormal, 0.0)).xyz;
    vViewSpaceViewDirection = -normalize(uModelViewMatrix * vec4(aPosition, 1.0)).xyz;
}