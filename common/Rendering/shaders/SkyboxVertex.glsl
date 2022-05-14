uniform mat4 uViewMatrix;	 
uniform mat4 uProjectionMatrix;	 
attribute vec3 aPosition;					 
varying vec3 vpos;								 
void main(void)	{							
    vpos = normalize(aPosition);		 
    gl_Position = uProjectionMatrix* vec4((uViewMatrix * vec4(aPosition, 0.0)).xyz,1.0); 
}