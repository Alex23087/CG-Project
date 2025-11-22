precision highp float;
 
uniform sampler2D uTexture;
uniform sampler2D uDepthTex;
uniform sampler2D uShadowMap;
uniform float uAmount;
uniform int uQuantize;
uniform int uAberration;
uniform int uInvert;
uniform float uNear;
uniform float uFar;
uniform mat4 uInvVPMatrix;
uniform vec3 uCameraPosWS;
uniform mat4 uLightMatrix;
uniform vec2 uViewportSize;
uniform int uFogEnabled;

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

float InterleavedGradientNoise(int pxX, int pxY) {
    return mod(52.9829189 * mod(0.06711056 * float(pxX) + 0.00583715 * float(pxY), 1.0), 1.0);
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

	if (uFogEnabled == 1) {
		// Parameters
		float maxDistance = 100.;
		float stepSize = 1.;
		float densityMultiplier = .1;
		const float maxIterations = 1000.;
		vec4 fogColour = vec4(0.1, 0.1, 0.1, 1.);
		vec4 lightColour = vec4(0.1, 0.1, 0.1, 1.);
		vec4 prevColour = gl_FragColor;


		float depth = texture2D(uDepthTex, vTexCoord).r;
		float linearDepth = fract(linearizeDepth(depth, uNear, uFar));
		// gl_FragColor = vec4(vec3(linearDepth), 1.0);
		vec3 worldPos = worldSpacePosition(vTexCoord, depth, uInvVPMatrix);
		// gl_FragColor = vec4(fract(worldPos), 1.);

		// vec3 lightPos = uLightMatrix * worldPos;

		vec3 entryPos = uCameraPosWS;
		vec3 viewDir = worldPos - entryPos;
		float viewLength = length(viewDir);
		vec3 ray = normalize(viewDir);

		float distanceLimit = min(viewLength, maxDistance);
		vec2 coords = vTexCoord * uViewportSize;
		float noiseOffset = stepSize;
		float distanceTravelled = InterleavedGradientNoise(int(coords.x), int(coords.y)) * noiseOffset;

		float transmittance = 1.;
		vec4 fColour = fogColour;

		for (float i = 0.; i < maxIterations; i++) {
			vec3 rayPos = entryPos + ray * distanceTravelled;

			transmittance *= exp(-densityMultiplier * stepSize);
			vec3 lightPos = (uLightMatrix * vec4(rayPos,1.)).xyz * .5 + .5;
			float shadowDepth = texture2D(uShadowMap, lightPos.xy).z;
			float lightAttenuation = 2.;
			if (shadowDepth < lightPos.z) {
				lightAttenuation = 0.;
			}
			fColour += lightColour * densityMultiplier * lightAttenuation * stepSize;

			distanceTravelled += stepSize;
			if (distanceTravelled >= distanceLimit) {
				break;
			}
		}
		fColour = clamp(fColour, 0., 1.);

		gl_FragColor = vec4(vec3(transmittance), 1.);
		gl_FragColor = mix(prevColour, fColour, 1.-clamp(transmittance, 0.15, 1.));
	}
}