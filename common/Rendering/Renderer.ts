import * as glMatrix from "../libs/gl-matrix/dist/esm/index.js"
import * as Shaders from "./Shaders.js"
import * as Cameras from "./Cameras.js"
import { Shape, TexturedShape } from "../shapes/Shape.js"
import { GameObject } from "./GameObject.js"
import { Spotlight } from "./Spotlight.js"
import { ShaderMaterial } from "./ShaderMaterial.js"
import { CubemapNames, TextureManager } from "./TextureManager.js"
import { Projector } from "./Projector.js"
import { Framebuffer } from "./Framebuffer.js"
import { PostProcessingShader } from "./PostProcessingShader.js"
import { Cube } from "../shapes/Cube.js"
import { Cylinder } from "../shapes/Cylinder.js"
import { Quad } from "../shapes/Quad.js"

export type Color = [number, number, number, number]
export type Dimension = {
	x: number,
	y: number
}

export class Renderer{
	public static instance: Renderer
	public gl: WebGL2RenderingContext
	wireframeEnabled = false

	canvas: HTMLCanvasElement
    canvasDefaultSize: Dimension = {x: 800, y: 450}

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

	private scale: number = 1
	private viewportSize: Dimension
	public postProcessingEnabled: boolean = false
	public quantize: boolean = false

	public textureManager: TextureManager
	private postProcessingFrameBuffer: Framebuffer | null = null
	private defaultFrameBuffer: Framebuffer
	private postProcessingShader: PostProcessingShader
	private postProcessingQuad: GameObject

	private viewMatrix: mat4
	private projectionMatrix: mat4
	private viewSpaceLightDirection: mat4


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

		this.initializeShapes()

		this.scene = GameObject.empty("Scene")

		this.currentTime = 0

		this.textureManager = new TextureManager()
		this.fov = Math.PI / 4

		this.computeViewportSize()
		this.defaultFrameBuffer = this.makeDefaultFramebuffer()
		this.postProcessingShader = new PostProcessingShader()
		this.postProcessingFrameBuffer = new Framebuffer("Postprocessing framebuffer", this.viewportSize)
		this.postProcessingQuad = new GameObject("PostProcessing quad", null, Shape.quad)
		
		ShaderMaterial.create(Shaders.UniformShader).then(material => {
			let image = new Image()
			image.src = "../../Assets/Textures/street4.png"
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

	private initializeShapes(){
		Shape.cube = new Cube()
		Shape.cylinder = new Cylinder(10)
		Shape.quad = new Quad([
			-1, -1, 0,
				1, -1, 0,
				1,  1, 0,
			-1,  1, 0
		], 1)
	}

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
			this.gl.uniform1i(material.shader.uSamplerLocation, this.textureManager.getTextureUnit(material.properties["texture"]))

			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, (obj as unknown as TexturedShape).texCoordsBuffer);
			this.gl.enableVertexAttribArray(material.shader.aTexCoordsIndex);
			this.gl.vertexAttribPointer(material.shader.aTexCoordsIndex, 2, this.gl.FLOAT, false, 0, 0)
		}

		if(Shaders.isCubemapped(material.shader)){
			this.gl.uniform1i(material.shader.uCubemapSamplerLocation, this.textureManager.getCubemapTexture(material.properties["cubemap"]))
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

			var projectors = []
			var textures = []
			for(var i = 0; i < this.lights.projectors.length; i++){
				for(var j = 0; j < 16; j++){
					projectors.push(this.lights.projectors[i].getMatrix()[j])
					textures.push(this.textureManager.getTextureUnit(this.lights.projectors[i].getTexture(), this.gl.CLAMP_TO_EDGE))
				}
			}
			this.gl.uniform1iv(material.shader.uProjectorSamplerLocation, textures)
			this.gl.uniformMatrix4fv(material.shader.uProjectorMatrixLocation, false, projectors)
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
	}

	private drawGameObject(gameObject: GameObject, parentMatrix: mat4 = this.viewMatrix){
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

	private drawFB(framebuffer: Framebuffer, camera: Cameras.Camera, gameObject: GameObject, clear: boolean = true, setup: () => void = () => {}){
		framebuffer.bind()
		this.gl.viewport(0, 0, this.viewportSize.x, this.viewportSize.y)
		if(clear){
			framebuffer.clear()
		}
		var ratio = this.viewportSize.x / this.viewportSize.y
		
		this.viewMatrix = camera.viewMatrix
		this.projectionMatrix = camera.projectionMatrix(this.fov, ratio)

		setup()

		this.drawGameObject(gameObject)

		this.gl.useProgram(null)
	}

	private drawFullscreenQuad(shader: PostProcessingShader){
		let gl = this.gl

		this.defaultFrameBuffer.bind()
		this.defaultFrameBuffer.clear()
		this.gl.viewport(0, 0, this.viewportSize.x / this.scale, this.viewportSize.y / this.scale)

		gl.useProgram(shader.program)

 
		gl.bindBuffer(gl.ARRAY_BUFFER, (this.postProcessingQuad.shape as unknown as TexturedShape).texCoordsBuffer)
		gl.enableVertexAttribArray(shader.texCoordLocation)
		gl.vertexAttribPointer(shader.texCoordLocation, 2, gl.FLOAT, false, 0, 0)

		gl.bindBuffer(gl.ARRAY_BUFFER, this.postProcessingQuad.shape.vertexBuffer)
		gl.enableVertexAttribArray(shader.positionLocation)
		gl.vertexAttribPointer(shader.positionLocation, 3, gl.FLOAT, false, 0, 0)

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.postProcessingQuad.shape.indexBufferTriangles);

		gl.uniform1i(gl.getUniformLocation(shader.program, "uTexture"), this.postProcessingFrameBuffer.getTexture())
		gl.uniform1f(gl.getUniformLocation(shader.program, "uAmount"), 1 + (this.findGameObjectWithName("mycar") as any).speed / 12)
		gl.uniform1i(gl.getUniformLocation(shader.program, "uQuantize"), this.quantize == true ? 1 : 0)
		gl.uniform1i(gl.getUniformLocation(shader.program, "uAberration"), this.postProcessingEnabled == true ? 1 : 0)

		gl.drawElements(gl.TRIANGLES, this.postProcessingQuad.shape.triangleIndices.length, gl.UNSIGNED_SHORT, 0)

		gl.useProgram(null)
	}

	private updateViewSpaceLightDirection(){
		this.viewSpaceLightDirection = glMatrix.vec3.transformMat4(glMatrix.vec3.create(), this.lights.directional, this.viewMatrix)
		glMatrix.vec3.normalize(this.viewSpaceLightDirection, this.viewSpaceLightDirection)
	}

	startRendering = (time: number) => {
		this.updateGameObjects(this.scene, time - this.currentTime)
		if(this.currentCamera){
			
			if(this.skybox){
				this.drawFB(this.postProcessingFrameBuffer, this.currentCamera, this.skybox, true, () => {this.gl.disable(this.gl.DEPTH_TEST)})
			}
			this.drawFB(this.postProcessingFrameBuffer, this.currentCamera, this.scene, !this.skybox, () => {this.updateViewSpaceLightDirection(); this.gl.enable(this.gl.DEPTH_TEST)})
			
			this.drawFullscreenQuad(this.postProcessingShader)
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
				this.resizeViewport({x: this.canvas.clientWidth, y: this.canvas.clientHeight})
            }
            window.addEventListener('resize', this.canvas.onresize)
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
			this.resizeViewport(this.canvasDefaultSize)
          }
        }
    }

	private resizeViewport(size: Dimension){
		this.canvas.width = size.x
		this.canvas.height = size.y
		this.computeViewportSize()
	}

	public setScale(scale: number){
		this.scale = scale
		this.computeViewportSize()
	}

	private computeViewportSize(){
		this.viewportSize = {
			x: this.canvas.width * this.scale,
			y: this.canvas.height * this.scale
		}

		this.postProcessingFrameBuffer?.resize(this.viewportSize)
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

	private makeDefaultFramebuffer(){
		let defaultFB = new Framebuffer("Default framebuffer", this.viewportSize)
		defaultFB.resize = () => {}

        this.textureManager.removeTexture(defaultFB.texture)
        this.gl.deleteFramebuffer(defaultFB.framebuffer)
        this.gl.deleteRenderbuffer(defaultFB.depthbuffer)

		defaultFB.clearColor = [0.34, 0.5, 0.74, 1.0]
		defaultFB.bind = defaultFB.unbind

		return defaultFB
	}

	private patchFramebufferForSkybox(framebuffer: Framebuffer){
		(framebuffer as any).clear2 = framebuffer.clear
		framebuffer.clear = () => {
			if(!this.skybox){
				(framebuffer as any).clear2()
			}
		}
	}
}