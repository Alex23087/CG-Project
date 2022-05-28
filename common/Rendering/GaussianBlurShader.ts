import { Renderer } from "./Renderer.js";

export class GaussianBlurShader {
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
		uniform vec2 uSize;
		uniform mat3 uKernel;
		
		varying vec2 vTexCoord;
		
		void main() {
			vec2 delta = 1.0/uSize;
			vec2 color = vec2(0,0);
			for (int i=0; i<=2; i++) {
				for (int j=0; j<=2; j++) {
					vec2 offset = vTexCoord + vec2(i-1, j-1)*delta;
					color += uKernel[i][j]*texture2D(uTexture, offset).xy;
				}
			}
			gl_FragColor = vec4(color, texture2D(uTexture, vTexCoord).z, 1.0);  

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
