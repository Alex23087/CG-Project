import { Renderer } from "./Renderer.js";

export class PostProcessingShader {
	program: WebGLProgram;
	texCoordLocation: number;
	positionLocation: number;

	constructor() { }

	public async compile() {
		var response = await fetch('../../../common/Rendering/shaders/PostProcessingVertex.glsl')
		var vsSource = await response.text()
		response = await fetch('../../../common/Rendering/shaders/PostProcessingFragment.glsl')
		var fsSource = await response.text()

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
