import * as glMatrix from "./libs/gl-matrix/dist/esm/index.js"
import * as Shaders from "./Shaders.js"
import { scene_0 } from "./scenes/scene_0.js"
import { Game } from "./game.js"

type Color = [number, number, number, number]

export type CameraIndex = 0 | 1

export class Renderer{
	cameras: any[]
	currentCamera: CameraIndex
	uniformShader: Shaders.UniformShader
	stack: any
	gl: WebGLRenderingContext
	canvas: HTMLCanvasElement
    car: any
    cube: any
    cylinder: any
    triangle: any
    game: Game

	public constructor(){
		/* array of cameras that will be used */
		this.cameras = [];
		// add a FollowFromUpCamera
		this.cameras.push(new FollowFromUpCamera());
		this.cameras.push(new ChaseCamera());
		// set the camera currently in use
		this.currentCamera = 1;
        /* create the canvas */
        this.canvas = document.getElementById("OUTPUT-CANVAS") as HTMLCanvasElement;
            
        /* get the webgl context */
        this.gl = this.canvas.getContext("webgl");

        /* read the webgl version and log */
        var gl_version = this.gl.getParameter(this.gl.VERSION); 
        console.log("glversion: " + gl_version);
        var GLSL_version = this.gl.getParameter(this.gl.SHADING_LANGUAGE_VERSION)
        console.log("glsl  version: "+GLSL_version);

        /* create the matrix stack */
        this.stack = new MatrixStack();
        this.game = new Game()
        /* initialize objects to be rendered */
        this.initializeObjects(this.gl);

        /* create the shader */
        Shaders.UniformShader.create(this.gl).then(program => {
			this.uniformShader = program
			this.Display()
		});
	}

	/*
	create the buffers for an object as specified in common/shapes/triangle.js
	*/
	createObjectBuffers(gl: WebGLRenderingContext, obj: any) {

		obj.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		obj.indexBufferTriangles = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		// create edges
		var edges = new Uint16Array(obj.numTriangles * 3 * 2);
		for (var i = 0; i < obj.numTriangles; ++i) {
			edges[i * 6 + 0] = obj.triangleIndices[i * 3 + 0];
			edges[i * 6 + 1] = obj.triangleIndices[i * 3 + 1];
			edges[i * 6 + 2] = obj.triangleIndices[i * 3 + 0];
			edges[i * 6 + 3] = obj.triangleIndices[i * 3 + 2];
			edges[i * 6 + 4] = obj.triangleIndices[i * 3 + 1];
			edges[i * 6 + 5] = obj.triangleIndices[i * 3 + 2];
		}

		obj.indexBufferEdges = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	};

	/*
	draw an object as specified in common/shapes/triangle.js for which the buffer 
	have alrady been created
	*/
	drawObject(gl: WebGLRenderingContext, obj: any, fillColor: Color, lineColor: Color) {

		gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
		gl.enableVertexAttribArray(this.uniformShader.aPositionIndex);
		gl.vertexAttribPointer(this.uniformShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

		gl.enable(gl.POLYGON_OFFSET_FILL);
		gl.polygonOffset(1.0, 1.0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
		gl.uniform4fv(this.uniformShader.uColorLocation, fillColor);
		gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

		gl.disable(gl.POLYGON_OFFSET_FILL);
		
		gl.uniform4fv(this.uniformShader.uColorLocation, lineColor);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
		gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		gl.disableVertexAttribArray(this.uniformShader.aPositionIndex);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	};

	/*
	initialize the object in the scene
	*/
	initializeObjects(gl: WebGLRenderingContext) {
		this.game.setScene(scene_0);
		this.car = this.game.addCar("mycar");
		this.triangle = new Triangle();

		this.cube = new Cube();
		this.createObjectBuffers(gl,this.cube);
		
		this.cylinder = new Cylinder(10);
		this.createObjectBuffers(gl,this.cylinder );
		
		this.createObjectBuffers(gl, this.triangle);

		this.createObjectBuffers(gl, this.game.scene.trackObj);
		this.createObjectBuffers(gl, this.game.scene.groundObj);
		for (var i = 0; i < this.game.scene.buildings.length; ++i) 
				this.createObjectBuffers(gl, this.game.scene.buildingsObj[i]);
	};



	/*
	draw the car
	*/
	drawCar(gl: WebGLRenderingContext) {

			var M                 = glMatrix.mat4.create();
			var rotate_transform  = glMatrix.mat4.create();
			var translate_matrix  = glMatrix.mat4.create();
			var scale_matrix      = glMatrix.mat4.create();
		
			glMatrix.mat4.fromTranslation(translate_matrix,[0,1,1]);
			glMatrix.mat4.fromScaling(scale_matrix,[0.7,0.25,1]);
			glMatrix.mat4.mul(M,scale_matrix,translate_matrix);
			glMatrix.mat4.fromRotation(rotate_transform,-0.1,[1,0,0]);
			glMatrix.mat4.mul(M,rotate_transform,M);
			glMatrix.mat4.fromTranslation(translate_matrix,[0,0.1,-1]);
			glMatrix.mat4.mul(M,translate_matrix,M);

			this.stack.push();
			this.stack.multiply(M);
			gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix);

			this.drawObject(gl,this.cube,[0.8,0.6,0.7,1.0],[0.8,0.6,0.7,1.0]);
			this.stack.pop();

			var Mw                 = glMatrix.mat4.create();
			/* draw the wheels */
			glMatrix.mat4.fromRotation(rotate_transform,3.14/2.0,[0,0,1]);
			glMatrix.mat4.fromTranslation(translate_matrix,[1,0,0]);
			glMatrix.mat4.mul(Mw,translate_matrix,rotate_transform);
			
			glMatrix.mat4.fromScaling(scale_matrix,[0.1,0.2,0.2]);
			glMatrix.mat4.mul(Mw,scale_matrix,Mw);
			/* now the diameter of the wheel is 2*0.2 = 0.4 and the wheel is centered in 0,0,0 */

			
			glMatrix.mat4.identity(M);
			
			glMatrix.mat4.fromTranslation(translate_matrix,[-0.8,0.2,-0.7]);
			glMatrix.mat4.mul(M,translate_matrix,Mw);

			this.stack.push();
			this.stack.multiply(M);
			gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix);
		
			this.drawObject(gl,this.cylinder,[1.0,0.6,0.5,1.0],[0.0,0.0,0.0,1.0]);
			this.stack.pop();

			glMatrix.mat4.fromTranslation(translate_matrix,[0.8,0.2,-0.7]);
			glMatrix.mat4.mul(M,translate_matrix,Mw);

			this.stack.push();
			this.stack.multiply(M);
			gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
			this.drawObject(gl,this.cylinder,[1.0,0.6,0.5,1.0],[0.0,0.0,0.0,1.0]);
			this.stack.pop();

			/* this will increase the size of the wheel to 0.4*1,5=0.6 */
			glMatrix.mat4.fromScaling(scale_matrix,[1,1.5,1.5]);;
			glMatrix.mat4.mul(Mw,scale_matrix,Mw);
			
			glMatrix.mat4.fromTranslation(translate_matrix,[0.8,0.25,0.7]);
			glMatrix.mat4.mul(M,translate_matrix,Mw);
		
			this.stack.push();
			this.stack.multiply(M);
			gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
			this.stack.pop();

			this.drawObject(gl,this.cylinder,[1.0,0.6,0.5,1.0],[0.0,0.0,0.0,1.0]);

			glMatrix.mat4.fromTranslation(translate_matrix,[-0.8,0.3,0.7]);
			glMatrix.mat4.mul(M,translate_matrix,Mw);
		
			this.stack.push();
			this.stack.multiply(M);
			gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
			this.drawObject(gl,this.cylinder,[1.0,0.6,0.5,1.0],[0.0,0.0,0.0,1.0]);
			this.stack.pop();
	};


	drawScene(gl: WebGLRenderingContext) {

		var width = this.canvas.width;
		var height = this.canvas.height
		var ratio = width / height;
		this.stack = new MatrixStack();

		gl.viewport(0, 0, width, height);
		
		gl.enable(gl.DEPTH_TEST);

		// Clear the framebuffer
		gl.clearColor(0.34, 0.5, 0.74, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


		gl.useProgram(this.uniformShader.program);
		
		gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation, false, glMatrix.mat4.perspective(glMatrix.mat4.create(), 3.14 / 4, ratio, 1, 500) as Float32List);

		this.cameras[this.currentCamera].update(this.car.frame);


		
		var invV = this.cameras[this.currentCamera].matrix();
		
		// initialize the stack with the identity
		this.stack.loadIdentity();
		// multiply by the view matrix
		this.stack.multiply(invV);

		// drawing the car
		this.stack.push();
		this.stack.multiply(this.car.frame); // projection * viewport
		//gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);
		this.drawCar(gl);
		this.stack.pop();

		gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix);

		// drawing the static elements (ground, track and buldings)
		this.drawObject(gl, this.game.scene.groundObj, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0]);
		this.drawObject(gl, this.game.scene.trackObj, [0.9, 0.8, 0.7, 1.0], [0, 0, 0, 1.0]);
		for (var i in this.game.scene.buildingsObj) 
			this.drawObject(gl, this.game.scene.buildingsObj[i], [0.8, 0.8, 0.8, 1.0], [0.2, 0.2, 0.2, 1.0]);
		gl.useProgram(null);
	};



	Display = () => {
		this.drawScene(this.gl);
        //console.log("drawing")
        var that = this
		window.requestAnimationFrame(this.Display)
	};
}


/*
the FollowFromUpCamera always look at the car from a position abova right over the car
*/
function FollowFromUpCamera(){

	/* the only data it needs is the position of the camera */
	this.frame = glMatrix.mat4.create();
	
	/* update the camera with the current car position */
	this.update = function(car_position){
		this.frame = car_position;
	}

	/* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
	this.matrix = function(){
		let eye = glMatrix.vec3.create();
		let target = glMatrix.vec3.create();
		let up = glMatrix.vec4.create();
		
		glMatrix.vec3.transformMat4(eye, [0  ,50,0], this.frame);
		glMatrix.vec3.transformMat4(target, [0.0,0.0,0.0,1.0], this.frame);
		glMatrix.vec4.transformMat4(up, [0.0,0.0,-1,0.0], this.frame);
		
		return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye,target, (up as number[]).slice(0,3));	
	}
}

/*
the ChaseCamera always look at the car from behind the car, slightly above
*/
function ChaseCamera(){

	/* the only data it needs is the frame of the camera */
	this.frame = [0,0,0];
	
	/* update the camera with the current car position */
	this.update = function(car_frame){
		this.frame = car_frame.slice();
	}

	/* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
	this.matrix = function(){
		let eye = glMatrix.vec3.create();
		let target = glMatrix.vec3.create();
		glMatrix.vec3.transformMat4(eye, [0  ,1.5,4,1.0], this.frame);
		glMatrix.vec3.transformMat4(target, [0.0,0.0,0.0,1.0], this.frame);
		return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye, target,[0, 1, 0]);	
	}
}