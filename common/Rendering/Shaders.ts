import { Renderer } from "./Renderer.js"

export abstract class Shader{
	public program: WebGLProgram

	protected abstract name: string

	public static async _compileProgram(shader: Shader){
		var response = await fetch('../../../common/Rendering/shaders/' + shader.name + 'Vertex.glsl')
		var vertexShaderSource = await response.text()

		response = await fetch('../../../common/Rendering/shaders/' + shader.name + 'Fragment.glsl')
		var fragmentShaderSource = await response.text()

		// create the vertex shader
		var vertexShader = Renderer.gl.createShader(Renderer.gl.VERTEX_SHADER)
		Renderer.gl.shaderSource(vertexShader, vertexShaderSource)
		Renderer.gl.compileShader(vertexShader)

		// create the fragment shader
		var fragmentShader = Renderer.gl.createShader(Renderer.gl.FRAGMENT_SHADER)
		Renderer.gl.shaderSource(fragmentShader, fragmentShaderSource)
		Renderer.gl.compileShader(fragmentShader)

		shader.program = Renderer.gl.createProgram()
		Renderer.gl.attachShader(shader.program, vertexShader)
		Renderer.gl.attachShader(shader.program, fragmentShader)

		Renderer.gl.linkProgram(shader.program)

		// If creating the shader program failed, alert
		if (!Renderer.gl.getProgramParameter(shader.program, Renderer.gl.LINK_STATUS)) {
			var str = "Unable to initialize the shader program.\n\n"
			str += "VS:\n" + Renderer.gl.getShaderInfoLog(vertexShader) + "\n\n"
			str += "FS:\n" + Renderer.gl.getShaderInfoLog(fragmentShader) + "\n\n"
			str += "PROG:\n" + Renderer.gl.getProgramInfoLog(shader.program)
			alert(str)
		}
	}

	public abstract _bindAttribs(gl: WebGLRenderingContext): void
	public abstract _getLocations(gl: WebGLRenderingContext): void

	protected static getSpotlightLocations(gl: WebGLRenderingContext, shader: SpotlightShader){
		shader.uSpotlightPositionsLocation = gl.getUniformLocation(shader.program, "uSpotlightPositions")
		shader.uSpotlightDirectionsLocation = gl.getUniformLocation(shader.program, "uSpotlightDirections")
		shader.uSpotlightAttenuationLocation = gl.getUniformLocation(shader.program, "uSpotlightAttenuation")
		shader.uSpotlightCutoffLocation = gl.getUniformLocation(shader.program, "uSpotlightCutoff")
		shader.uSpotlightColorsLocation = gl.getUniformLocation(shader.program, "uSpotlightColors")
		shader.uSpotlightFocusLocation = gl.getUniformLocation(shader.program, "uSpotlightFocus")
		shader.uSpotlightIntensityLocation = gl.getUniformLocation(shader.program, "uSpotlightIntensity")
	}
}

export async function create<T extends Shader>(type: {new(): T}): Promise<T> {
	var instance = (type as any).instance

	if(instance == null || instance == undefined){
		var shader = new type()
		await Shader._compileProgram(shader)
		shader._bindAttribs(Renderer.gl)
		shader._getLocations(Renderer.gl);
		(type as any).instance = shader
		return shader
	}else{
		return instance
	}
}

interface PositionableShader extends Shader{
	aPositionIndex: 0
}

interface NormalShader extends Shader{
	aNormalIndex: 1
}

interface ColorableShader extends Shader{
	uColorLocation: WebGLUniformLocation
}

interface ShinyShader extends Shader{
	uShininessLocation: WebGLUniformLocation
}

interface MVMatrixShader extends Shader{
	uModelViewMatrixLocation: WebGLUniformLocation
}

interface ProjectionMatrixShader extends Shader{
	uProjectionMatrixLocation: WebGLUniformLocation
}

interface ViewMatrixShader extends Shader{
	uViewMatrixLocation: WebGLUniformLocation
}

interface ViewSpaceLightDirectionShader extends Shader{
	uViewSpaceLightDirectionLocation: WebGLUniformLocation
}

interface LightDirectionShader extends Shader{
	uLightDirectionLocation: WebGLUniformLocation
}

interface SpotlightShader extends Shader{
	uSpotlightPositionsLocation: WebGLUniformLocation
	uSpotlightDirectionsLocation: WebGLUniformLocation
	uSpotlightAttenuationLocation: WebGLUniformLocation
	uSpotlightCutoffLocation: WebGLUniformLocation
	uSpotlightColorsLocation: WebGLUniformLocation
	uSpotlightFocusLocation: WebGLUniformLocation
	uSpotlightIntensityLocation: WebGLUniformLocation
}

interface TexturedShader extends Shader{
	uSamplerLocation: WebGLUniformLocation
	aTexCoordsIndex: 2
}

export function isPositionable(object: Shader): object is PositionableShader{
	return 'aPositionIndex' in object
}

export function isNormal(object: Shader): object is NormalShader{
	return 'aNormalIndex' in object
}

export function isColorable(object: Shader): object is ColorableShader{
	return 'uColorLocation' in object
}

export function isShiny(object: Shader): object is ShinyShader{
	return 'uShininessLocation' in object
}

export function hasMVMatrix(object: Shader): object is MVMatrixShader{
	return 'uModelViewMatrixLocation' in object
}

export function hasProjectionMatrix(object: Shader): object is ProjectionMatrixShader{
	return 'uProjectionMatrixLocation' in object
}

export function hasViewMatrix(object: Shader): object is ViewMatrixShader{
	return 'uViewMatrixLocation' in object
}

export function hasViewSpaceLightDirection(object: Shader): object is ViewSpaceLightDirectionShader{
	return 'uViewSpaceLightDirectionLocation' in object
}

export function hasLightDirection(object: Shader): object is LightDirectionShader{
	return 'uLightDirectionLocation' in object
}

export function supportsSpotlights(object: Shader): object is SpotlightShader{
	return 'uSpotlightPositionsLocation' in object
}

export function isTextured(object: Shader): object is TexturedShader{
	return 'uSamplerLocation' in object
}



export class UniformShader extends Shader implements PositionableShader, ColorableShader, MVMatrixShader, ProjectionMatrixShader {
	name: string = "UniformShader"

	aPositionIndex: 0 = 0

	uColorLocation: WebGLUniformLocation
	uModelViewMatrixLocation: WebGLUniformLocation
	uProjectionMatrixLocation: WebGLUniformLocation


	_bindAttribs(gl: WebGLRenderingContext){
		this.aPositionIndex = 0
		gl.bindAttribLocation(this.program, this.aPositionIndex, "aPosition")
	}

	_getLocations(gl: WebGLRenderingContext){
		this.uModelViewMatrixLocation = gl.getUniformLocation(this.program, "uModelViewMatrix")
		this.uProjectionMatrixLocation = gl.getUniformLocation(this.program, "uProjectionMatrix")
		this.uColorLocation = gl.getUniformLocation(this.program, "uColor")
	}
}


export class PhongShader extends Shader implements PositionableShader, NormalShader, ColorableShader, ShinyShader, MVMatrixShader, ProjectionMatrixShader, ViewSpaceLightDirectionShader{
	name: string = "Phong"
	
	aPositionIndex: 0 = 0
	aNormalIndex: 1 = 1

	uColorLocation: WebGLUniformLocation
	uShininessLocation: WebGLUniformLocation
	uModelViewMatrixLocation: WebGLUniformLocation
	uProjectionMatrixLocation: WebGLUniformLocation
	uViewSpaceLightDirectionLocation: WebGLUniformLocation

	_bindAttribs(gl: WebGLRenderingContext): void {
		gl.bindAttribLocation(this.program, this.aPositionIndex, "aPosition")
		gl.bindAttribLocation(this.program, this.aNormalIndex, "aNormal")
	}
	_getLocations(gl: WebGLRenderingContext): void {
		this.uModelViewMatrixLocation = gl.getUniformLocation(this.program, "uModelViewMatrix")
		this.uProjectionMatrixLocation = gl.getUniformLocation(this.program, "uProjectionMatrix")
		this.uColorLocation = gl.getUniformLocation(this.program, "uColor")
		this.uShininessLocation = gl.getUniformLocation(this.program, "uShininess")
		this.uViewSpaceLightDirectionLocation = gl.getUniformLocation(this.program, "uViewSpaceLightDirection")
	}
}

export class PhongSpotlightShader extends Shader implements
	PositionableShader, NormalShader, ColorableShader, ShinyShader,
	MVMatrixShader, ProjectionMatrixShader, ViewMatrixShader, LightDirectionShader, SpotlightShader
{
	name: string = "PhongSpotlight"
	
	aPositionIndex: 0 = 0
	aNormalIndex: 1 = 1

	uColorLocation: WebGLUniformLocation
	uShininessLocation: WebGLUniformLocation

	uModelViewMatrixLocation: WebGLUniformLocation
	uProjectionMatrixLocation: WebGLUniformLocation
	uViewMatrixLocation: WebGLUniformLocation

	uLightDirectionLocation: WebGLUniformLocation

	uSpotlightPositionsLocation: WebGLUniformLocation
	uSpotlightDirectionsLocation: WebGLUniformLocation
	uSpotlightAttenuationLocation: WebGLUniformLocation
	uSpotlightCutoffLocation: WebGLUniformLocation
	uSpotlightColorsLocation: WebGLUniformLocation
	uSpotlightFocusLocation: WebGLUniformLocation
	uSpotlightIntensityLocation: WebGLUniformLocation

	_bindAttribs(gl: WebGLRenderingContext): void {
		gl.bindAttribLocation(this.program, this.aPositionIndex, "aPosition")
		gl.bindAttribLocation(this.program, this.aNormalIndex, "aNormal")
	}
	_getLocations(gl: WebGLRenderingContext): void {
		this.uModelViewMatrixLocation = gl.getUniformLocation(this.program, "uModelViewMatrix")
		this.uProjectionMatrixLocation = gl.getUniformLocation(this.program, "uProjectionMatrix")
		this.uColorLocation = gl.getUniformLocation(this.program, "uColor")
		this.uShininessLocation = gl.getUniformLocation(this.program, "uShininess")
		this.uLightDirectionLocation = gl.getUniformLocation(this.program, "uLightDirection")
		this.uViewMatrixLocation = gl.getUniformLocation(this.program, "uViewMatrix")
		Shader.getSpotlightLocations(gl, this)
	}
}

export class PhongSpotlightTexturedShader extends Shader implements
PositionableShader, NormalShader, ShinyShader,
MVMatrixShader, ProjectionMatrixShader, ViewMatrixShader, LightDirectionShader, SpotlightShader, TexturedShader {
	name: string = "PhongSpotlightTexture"
	
	aPositionIndex: 0 = 0
	aNormalIndex: 1 = 1
	aTexCoordsIndex: 2 = 2

	uShininessLocation: WebGLUniformLocation
	uSamplerLocation: WebGLUniformLocation

	uModelViewMatrixLocation: WebGLUniformLocation
	uProjectionMatrixLocation: WebGLUniformLocation
	uViewMatrixLocation: WebGLUniformLocation

	uLightDirectionLocation: WebGLUniformLocation

	uSpotlightPositionsLocation: WebGLUniformLocation
	uSpotlightDirectionsLocation: WebGLUniformLocation
	uSpotlightAttenuationLocation: WebGLUniformLocation
	uSpotlightCutoffLocation: WebGLUniformLocation
	uSpotlightColorsLocation: WebGLUniformLocation
	uSpotlightFocusLocation: WebGLUniformLocation
	uSpotlightIntensityLocation: WebGLUniformLocation

	_bindAttribs(gl: WebGLRenderingContext): void {
		gl.bindAttribLocation(this.program, this.aPositionIndex, "aPosition")
		gl.bindAttribLocation(this.program, this.aNormalIndex, "aNormal")
		gl.bindAttribLocation(this.program, this.aTexCoordsIndex, "aTexCoords")
	}
	_getLocations(gl: WebGLRenderingContext): void {
		this.uModelViewMatrixLocation = gl.getUniformLocation(this.program, "uModelViewMatrix")
		this.uProjectionMatrixLocation = gl.getUniformLocation(this.program, "uProjectionMatrix")
		this.uShininessLocation = gl.getUniformLocation(this.program, "uShininess")
		this.uLightDirectionLocation = gl.getUniformLocation(this.program, "uLightDirection")
		this.uViewMatrixLocation = gl.getUniformLocation(this.program, "uViewMatrix")
		this.uSamplerLocation = gl.getUniformLocation(this.program, "uSampler")
		Shader.getSpotlightLocations(gl, this)
	}
}