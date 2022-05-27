import { Renderer } from "./Renderer.js";

export class PostProcessingShader {
	program: WebGLProgram;
	texCoordLocation: number;
	positionLocation: number;

	constructor() {
		let vsSource = `
		attribute vec2 aTexCoord;
		attribute vec2 aPosition;

		varying vec2 vTexCoord;
		 
		void main() {
		   vTexCoord = aTexCoord;
		   gl_Position = vec4(aPosition, 0.0, 1.0);
		}`;
		let fsSource = `
		precision mediump float;
 
		uniform sampler2D uTexture;
		uniform float uAmount;
		uniform int uQuantize;
		
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
		
		void main() {
			vec2 iuv = (vTexCoord * 2.0) - 1.0;
			iuv /= uAmount;
			iuv = (iuv + 1.0) * 0.5;

			float colR = texture2D(uTexture, iuv).r;
			float colG = texture2D(uTexture, vTexCoord).g;

			iuv = (vTexCoord * 2.0) - 1.0;
			iuv /= (1.0 / uAmount);
			iuv = (iuv + 1.0) * 0.5;

			float colB = texture2D(uTexture, iuv).b;
			//gl_FragColor = texture2D(uTexture, vTexCoord);
			gl_FragColor = vec4(colR, colG, colB, 1.0);

			if(uQuantize == 1){
				vec3 color_resolution = vec3(1024.0, 1024.0, 8.0);
				vec3 color_bands = floor(rgb2hsv(gl_FragColor.rgb) * color_resolution) / (color_resolution - 1.0);
				gl_FragColor = vec4(min(hsv2rgb(color_bands), 1.0), gl_FragColor.a);
			}
		}`;

		let gl = Renderer.instance.gl;
		let vs = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vs, vsSource);
		gl.compileShader(vs);
		let fs = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fs, fsSource);
		gl.compileShader(fs);
		let program = gl.createProgram();
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		this.texCoordLocation = 1;
		this.positionLocation = 0;
		gl.bindAttribLocation(program, this.texCoordLocation, "aTexCoord");
		gl.bindAttribLocation(program, this.positionLocation, "aPosition");
		gl.linkProgram(program);
		if (!Renderer.instance.gl.getProgramParameter(program, Renderer.instance.gl.LINK_STATUS)) {
			var str = "Unable to initialize the shader program.\n\n";
			str += "VS:\n" + Renderer.instance.gl.getShaderInfoLog(vs) + "\n\n";
			str += "FS:\n" + Renderer.instance.gl.getShaderInfoLog(fs) + "\n\n";
			str += "PROG:\n" + Renderer.instance.gl.getProgramInfoLog(program);
			alert(str);
		}

		this.program = program;
	}
}
