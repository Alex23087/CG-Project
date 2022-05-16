import * as glMatrix from "../libs/gl-matrix/dist/esm/index.js"
import * as Shaders from "./Shaders.js"
import * as Cameras from "./Cameras.js"
import { Shape, TexturedShape } from "../shapes/Shape.js"
import { GameObject } from "./GameObject.js"
import { Spotlight } from "./Spotlight.js"
import { ShaderMaterial } from "./ShaderMaterial.js"
import { CubemapNames, TextureCache } from "./TextureCache.js"
import { Projector } from "./Projector.js"

type Color = [number, number, number, number]

export class Renderer{
	public static instance: Renderer
	public gl: WebGL2RenderingContext
	wireframeEnabled = false

	canvas: HTMLCanvasElement
    canvasDefaultSize: {x: number, y: number} = {x: 800, y: 450}

	currentCamera: Cameras.Camera

	private lights: {
		spotlights: Spotlight[]
		directional: vec3
		projectors: Projector[]
	}
	private defaultMaterial: ShaderMaterial
	private defaultTexture: WebGLTexture
	private skybox: GameObject | null = null

	private currentTime: number
	private scene: GameObject

	public fov: number

	public scale: number = 1
	public postProcessingEnabled: boolean = false

	public textureCache: TextureCache

	public constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas

		Renderer.instance = this
            
        /* get the webgl context */
        this.gl = this.canvas.getContext("webgl2");

        /* read the webgl version and log */
        var gl_version = this.gl.getParameter(this.gl.VERSION); 
        console.log("GL version: " + gl_version);
        var GLSL_version = this.gl.getParameter(this.gl.SHADING_LANGUAGE_VERSION)
        console.log("GLSL version: " + GLSL_version);

		this.lights = {
			spotlights: [],
			directional: [0, -1, 0],
			projectors: []
		}

		this.scene = GameObject.empty("Scene")

		this.currentTime = 0

		this.textureCache = new TextureCache()
		this.fov = Math.PI / 4
		
		ShaderMaterial.create(Shaders.UniformShader).then(material => {
			let image = new Image()
			image.src = "../common/textures/street4.png"
			image.addEventListener('load', () => {
				this.defaultMaterial = material


				this.gl.activeTexture(this.gl.TEXTURE0);
				this.defaultTexture = this.gl.createTexture();
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.defaultTexture);
				this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, image);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
				this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
				this.gl.generateMipmap(this.gl.TEXTURE_2D)


				this.startRendering(0)
			})
		})
	}

	private viewMatrix: mat4
	private projectionMatrix: mat4
	private viewSpaceLightDirection: mat4

	private drawObject(modelMatrix: mat4, obj: Shape, material: ShaderMaterial | null){
		if(!material){
			material = this.defaultMaterial
		}

		this.gl.useProgram(material.shader.program)
		
		if(Shaders.hasProjectionMatrix(material.shader)){
			this.gl.uniformMatrix4fv(material.shader.uProjectionMatrixLocation, false, this.projectionMatrix as Float32List);
		}

		if(Shaders.hasViewMatrix(material.shader)){
			this.gl.uniformMatrix4fv(material.shader.uViewMatrixLocation, false, this.viewMatrix as Float32List)
		}

		if(Shaders.hasLightDirection(material.shader)){
			this.gl.uniform3fv(material.shader.uLightDirectionLocation, this.lights.directional as Float32List)
		}

		if(Shaders.hasViewSpaceLightDirection(material.shader)){
			this.gl.uniform3fv(material.shader.uViewSpaceLightDirectionLocation, this.viewSpaceLightDirection as Float32List)
		}

		if(Shaders.hasMVMatrix(material.shader)){
			this.gl.uniformMatrix4fv(
				material.shader.uModelViewMatrixLocation, false,
				modelMatrix as Float32List
			)
		}

		if(Shaders.isTextured(material.shader)){
			this.gl.uniform1i(material.shader.uSamplerLocation, this.textureCache.getTexture(material.properties["texture"]))

			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, (obj as unknown as TexturedShape).texCoordsBuffer);
			this.gl.enableVertexAttribArray(material.shader.aTexCoordsIndex);
			this.gl.vertexAttribPointer(material.shader.aTexCoordsIndex, 2, this.gl.FLOAT, false, 0, 0)
		}

		if(Shaders.isCubemapped(material.shader)){
			this.gl.uniform1i(material.shader.uCubemapSamplerLocation, this.textureCache.getCubemapTexture(material.properties["cubemap"]))
		}

		if(Shaders.isPositionable(material.shader)){
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.vertexBuffer);
			this.gl.enableVertexAttribArray(material.shader.aPositionIndex);
			this.gl.vertexAttribPointer(material.shader.aPositionIndex, 3, this.gl.FLOAT, false, 0, 0);
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
		}

		if(Shaders.isNormal(material.shader)){
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.normalBuffer);
			this.gl.enableVertexAttribArray(material.shader.aNormalIndex);
			this.gl.vertexAttribPointer(material.shader.aNormalIndex, 3, this.gl.FLOAT, false, 0, 0);
		}

		if(Shaders.isShiny(material.shader)){
			this.gl.uniform1f(material.shader.uShininessLocation, 3)
		}

		if(Shaders.isColorable(material.shader)){
			this.gl.uniform4fv(material.shader.uColorLocation, material.properties["color"]);
		}

		if(Shaders.supportsSpotlights(material.shader)){
			var attenuation = []
			var colors = []
			var cutoff = []
			var direction = []
			var focus = []
			var intensity = []
			var position = []
			for(var i = 0; i < this.lights.spotlights.length; i++){
				attenuation[i] = this.lights.spotlights[i].attenuation
				cutoff[i] = this.lights.spotlights[i].cutoff
				focus[i] = this.lights.spotlights[i].focus
				intensity[i] = this.lights.spotlights[i].intensity

				let spotlightDirection = this.lights.spotlights[i].worldDirection
				let spotlightPosition = this.lights.spotlights[i].worldPosition

				for(var j = 0; j < 3; j++){
					colors[i * 3 + j] = this.lights.spotlights[i].color[j]
					direction[i * 3 + j] = spotlightDirection[j]
					position[i * 3 + j] = spotlightPosition[j]
				}
			}
			this.gl.uniform1fv(material.shader.uSpotlightAttenuationLocation, attenuation)
			this.gl.uniform3fv(material.shader.uSpotlightColorsLocation, colors)
			this.gl.uniform1fv(material.shader.uSpotlightCutoffLocation, cutoff)
			this.gl.uniform3fv(material.shader.uSpotlightDirectionsLocation, direction)
			this.gl.uniform1fv(material.shader.uSpotlightFocusLocation, focus)
			this.gl.uniform1fv(material.shader.uSpotlightIntensityLocation, intensity)
			this.gl.uniform3fv(material.shader.uSpotlightPositionsLocation, position)
		}

		if(Shaders.isProjectorShader(material.shader)){
			/*		if(Shaders.isProjectorShader(material.shader)){
			this.gl.uniform1iv(material.shader.uProjectorSamplerLocation, [
				this.textureCache.getTexture(this.lights.projectors[0].getTexture(), this.gl.CLAMP_TO_EDGE),
				this.textureCache.getTexture(this.lights.projectors[1].getTexture(), this.gl.CLAMP_TO_EDGE)
			])

			var projectors = []
			for(var i = 0; i < this.lights.projectors.length; i++){
				for(var j = 0; j < 16; j++){
					projectors.push(this.lights.projectors[i][j])
				}
			}
			this.gl.uniformMatrix4fv(material.shader.uProjectorMatrixLocation, false, projectors)
		}
		*/
			this.gl.uniform1iv(material.shader.uProjectorSamplerLocation, [
				this.textureCache.getTexture(this.lights.projectors[0].getTexture(), this.gl.CLAMP_TO_EDGE),
				this.textureCache.getTexture(this.lights.projectors[0].getTexture(), this.gl.CLAMP_TO_EDGE)
			])

			var projectors = []
			for(var i = 0; i < this.lights.projectors.length; i++){
				for(var j = 0; j < 16; j++){
					projectors.push(this.lights.projectors[i].getMatrix()[j])
				}
			}
			this.gl.uniformMatrix4fv(material.shader.uProjectorMatrixLocation, false, projectors)
			//this.gl.uniformMatrix4fv(material.shader.uProjectorMatrixLocation, false, this.lights.projectors[0].getMatrix() as Float32List)
		}

		if(this.wireframeEnabled){
			this.gl.enable(this.gl.POLYGON_OFFSET_FILL);
			this.gl.polygonOffset(1.0, 1.0);
		}


		this.gl.drawElements(this.gl.TRIANGLES, obj.triangleIndices.length, this.gl.UNSIGNED_SHORT, 0);


		if(this.wireframeEnabled && Shaders.isColorable(material.shader)){
			this.gl.disable(this.gl.POLYGON_OFFSET_FILL);
			this.gl.uniform4fv(material.shader.uColorLocation, [0, 0, 0]);
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
			this.gl.drawElements(this.gl.LINES, obj.numTriangles * 3 * 2, this.gl.UNSIGNED_SHORT, 0);
		}

		if(Shaders.isPositionable(material.shader)){
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
			this.gl.disableVertexAttribArray(material.shader.aPositionIndex);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
		}
	};


	private drawGameObject(gameObject: GameObject, parentMatrix: mat4){
		var modelMatrix = gameObject.transform.applyLocalTransform(
			glMatrix.mat4.create(),
			parentMatrix
		)

		if(gameObject.shape){			
			this.drawObject(modelMatrix, gameObject.shape, gameObject.material)
		}

		for(var i = 0; i < gameObject.children.length; i++){
			this.drawGameObject(gameObject.children[i], modelMatrix)
		}
	}

	public findGameObjectWithName(name: string): GameObject{
		return this.scene.findChildWithName(name)
	}

	private draw() {
		var width = this.canvas.width * this.scale
		var height = this.canvas.height * this.scale
		var ratio = width / height;

		var targetTexture: WebGLTexture
		var framebuffer: WebGLFramebuffer
		var depthBuffer: WebGLRenderbuffer
		if(this.postProcessingEnabled){
			this.gl.activeTexture(this.gl.TEXTURE0)
			targetTexture = this.gl.createTexture()
			this.gl.bindTexture(this.gl.TEXTURE_2D, targetTexture)
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null)
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

			framebuffer = this.gl.createFramebuffer()
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer)
			this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, targetTexture, 0)

			depthBuffer = this.gl.createRenderbuffer()
			this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthBuffer)
			this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height)
			this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, depthBuffer)
		}

		this.gl.viewport(0, 0, width, height);

		// Clear the framebuffer
		this.gl.clearColor(0.34, 0.5, 0.74, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		this.viewMatrix = this.currentCamera.inverseViewMatrix

		if(this.skybox){
			this.gl.disable(this.gl.DEPTH_TEST);
			this.projectionMatrix = glMatrix.mat4.perspective(glMatrix.mat4.create(), this.fov, ratio, 0.1, 500)
			this.drawGameObject(this.skybox, glMatrix.mat4.create())
		}

		this.gl.enable(this.gl.DEPTH_TEST);
		// Set matrices
		this.projectionMatrix = glMatrix.mat4.perspective(glMatrix.mat4.create(), this.fov, ratio, 1, 500)
		this.viewSpaceLightDirection = glMatrix.vec3.transformMat4(glMatrix.vec3.create(), this.lights.directional, this.viewMatrix)
		glMatrix.vec3.normalize(this.viewSpaceLightDirection, this.viewSpaceLightDirection)
		this.drawGameObject(this.scene, this.viewMatrix)
		this.gl.useProgram(null)

		if(this.postProcessingEnabled){
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
			this.gl.activeTexture(this.gl.TEXTURE0)
			this.gl.bindTexture(this.gl.TEXTURE_2D, targetTexture)
			this.gl.viewport(0, 0, width / this.scale, height / this.scale)
			this.gl.clearColor(0, 0, 0, 1)
			this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

			this.drawPostProcessing()

			this.gl.deleteTexture(targetTexture)
			this.gl.deleteFramebuffer(framebuffer)
			this.gl.deleteRenderbuffer(depthBuffer)
			this.gl.useProgram(null)
		}
	}

	private drawPostProcessing(){
		//TODO: Optimize and move somewhere else
		let vsSource = `
		attribute vec2 aTexCoord;
		attribute vec2 aPosition;

		varying vec2 vTexCoord;
		 
		void main() {
		   vTexCoord = aTexCoord;
		   gl_Position = vec4(aPosition, 0.0, 1.0);
		}`
		let fsSource = `
		precision mediump float;
 
		uniform sampler2D uTexture;
		uniform float uAmount;
		
		varying vec2 vTexCoord;
		
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
		}`
		let gl = this.gl
		let vs = gl.createShader(gl.VERTEX_SHADER)
		gl.shaderSource(vs, vsSource)
		gl.compileShader(vs)
		let fs = gl.createShader(gl.FRAGMENT_SHADER)
		gl.shaderSource(fs, fsSource)
		gl.compileShader(fs)
		let program = gl.createProgram()
		gl.attachShader(program, vs)
		gl.attachShader(program, fs)
		var texCoordLocation = 1
		var positionLocation = 0
		gl.bindAttribLocation(program, texCoordLocation, "aTexCoord")
		gl.bindAttribLocation(program, positionLocation, "aPosition")
		gl.linkProgram(program)
		if (!Renderer.instance.gl.getProgramParameter(program, Renderer.instance.gl.LINK_STATUS)) {
			var str = "Unable to initialize the shader program.\n\n"
			str += "VS:\n" + Renderer.instance.gl.getShaderInfoLog(vs) + "\n\n"
			str += "FS:\n" + Renderer.instance.gl.getShaderInfoLog(fs) + "\n\n"
			str += "PROG:\n" + Renderer.instance.gl.getProgramInfoLog(program)
			alert(str)
		}
		gl.useProgram(program)

 
		// provide texture coordinates for the rectangle.
		var texCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			0.0,  0.0,
			1.0,  0.0,
			0.0,  1.0,
			0.0,  1.0,
			1.0,  0.0,
			1.0,  1.0]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(texCoordLocation);
		gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 8, 0);

		var positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); 
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			-1, -1,
			1, -1,
			-1, 1,
			-1, 1,
			1, -1,
			1, 1,
		]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 8, 0);

		gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0)
		gl.uniform1f(gl.getUniformLocation(program, "uAmount"), 1 + (this.findGameObjectWithName("mycar") as any).speed / 12)

		gl.drawArrays(gl.TRIANGLES, 0, 6)
	}



	startRendering = (time: number) => {
		this.updateGameObjects(this.scene, time - this.currentTime)
		if(this.currentCamera){
			this.draw();
		}
		this.currentTime = time
		window.requestAnimationFrame(this.startRendering)
	}

	private updateGameObjects(obj: GameObject, deltaT: number){
		obj.update(deltaT)
		for(var i = 0; i < obj.children.length; i++){
			this.updateGameObjects(obj.children[i], deltaT)
		}
	}

    toggleFullscreen(){
        if (!document.fullscreenElement) {
            this.canvas.requestFullscreen();
            this.canvas.onresize = () => {
                this.canvas.width = this.canvas.clientWidth
                this.canvas.height = this.canvas.clientHeight
            }
            window.addEventListener('resize', this.canvas.onresize)
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
            this.canvas.width = this.canvasDefaultSize.x
            this.canvas.height = this.canvasDefaultSize.y
          }
        }
    }

	addObjectToScene(go: GameObject){
		this.scene.addChild(go)
	}

	addSpotlight(spotlight: Spotlight){
		this.lights.spotlights.push(spotlight)
	}

	addProjector(projector: Projector){
		this.lights.projectors.push(projector)
	}

	setDirectionalLight(direction: vec3){
		this.lights.directional = direction
	}

	setSkybox(textures: CubemapNames){
		this.skybox = new GameObject("Skybox", null, Shape.cube)
		ShaderMaterial.create(Shaders.SkyboxShader).then(material => {
			this.skybox.material = material
			material.setCubemapTexture(textures)
		})
	}

	disableSkybox(){
		this.skybox = null
	}
}