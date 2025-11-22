precision highp float;
 
uniform sampler2D uTexture;
uniform sampler2D uDepthTex;
uniform float uAmount;
uniform int uQuantize;
uniform int uAberration;
uniform int uInvert;
uniform float uNear;
uniform float uFar;
uniform mat4 uInvVPMatrix;

varying vec2 vTexCoord;

vec3 rgb2hsv(vec3 c)
{
	vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
	vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

	float d = q.x - min(q.w, q.y);
	float e = 1.0e-10;
	return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float linearizeDepth(float depth, float near, float far) {
	return (2.0 * near * far) / (far + near - depth * (far - near));
}

vec4 clipSpacePosition(vec2 positionNDC, float depth) {
	return vec4(positionNDC * 2. - 1., depth * 2. - 1., 1.);
}

vec3 worldSpacePosition(vec2 positionNDC, float depth, mat4 invViewProjMatrix) {
	vec4 positionCS = clipSpacePosition(positionNDC, depth);
	vec4 positionWS = invViewProjMatrix * positionCS;
	return positionWS.xyz / positionWS.w;
}

void main() {
	if(uAberration == 1){
		vec2 iuv = (vTexCoord * 2.0) - 1.0;
		iuv /= uAmount;
		iuv = (iuv + 1.0) * 0.5;

		float colR = texture2D(uTexture, iuv).r;
		float colG = texture2D(uTexture, vTexCoord).g;

		iuv = (vTexCoord * 2.0) - 1.0;
		iuv /= (1.0 / uAmount);
		iuv = (iuv + 1.0) * 0.5;

		float colB = texture2D(uTexture, iuv).b;
		gl_FragColor = vec4(colR, colG, colB, 1.0);
	}else{
		gl_FragColor = texture2D(uTexture, vTexCoord);
	}

	if(uQuantize == 1){
		vec3 color_resolution = vec3(1024.0, 1024.0, 8.0);
		vec3 color_bands = floor(rgb2hsv(gl_FragColor.rgb) * color_resolution) / (color_resolution - 1.0);
		gl_FragColor = vec4(min(hsv2rgb(color_bands), 1.0), gl_FragColor.a);
	}

	if(uInvert == 1){
		vec3 col = rgb2hsv(gl_FragColor.rgb);
		col.x += 0.5;
		col = hsv2rgb(col);
		gl_FragColor = vec4(col, gl_FragColor.a);
	}

	{
		float depth = texture2D(uDepthTex, vTexCoord).r;
		float linearDepth = fract(linearizeDepth(depth, uNear, uFar));
		gl_FragColor = vec4(vec3(linearDepth), 1.0);
		vec3 worldPos = worldSpacePosition(vTexCoord, depth, uInvVPMatrix);
		gl_FragColor = vec4(fract(worldPos), 1.);
	}
}