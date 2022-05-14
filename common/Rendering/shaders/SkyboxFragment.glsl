precision highp float;					 
uniform samplerCube uCubemapSampler;
varying vec3 vpos;

void main(void)	{
    gl_FragColor = textureCube(uCubemapSampler,normalize(vpos));
}