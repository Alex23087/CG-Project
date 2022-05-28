import { Car } from "./GameObjects/Car.js"
import { Track } from "../common/shapes/Track.js"
import { Quad } from "../common/shapes/Quad.js"
import { Building, TexturedFacades, TexturedRoof } from "../common/shapes/Building.js"
import { Parser } from "./Parser.js"
import { Shape } from "../common/shapes/Shape.js"
import { Cube } from "../common/shapes/Cube.js"
import { Cylinder } from "../common/shapes/Cylinder.js"
import { GameObject } from "../common/Rendering/GameObject.js"
import { scene_0 } from "../common/scenes/scene_0.js"
import { Renderer } from "../common/Rendering/Renderer.js"
import { Camera, FreeCamera, LateChaseCamera } from "../common/Rendering/Cameras.js"
import { ShaderMaterial } from "../common/Rendering/ShaderMaterial.js"
import * as Shaders from "../common/Rendering/Shaders.js"
import { LampPost } from "./GameObjects/LampPost.js"
import { Billboard } from "./GameObjects/Billboard.js"
import { Tree } from "./GameObjects/Tree.js"

export interface StringIndexedBooleanArray{
    [index: string]: boolean
}

export class Game {
	car: Car
	scene: any

	cameras: Camera[]

	private worldGameObject: GameObject

	constructor(renderer: Renderer){
		this.cameras = []
		this.initializeObjects(renderer)
	}

	addCar(name: string){
		var newCar = new Car(name, this.scene.startPosition)
		this.car = newCar;
		return newCar;
  	}
	
  	setScene(scene){
		this.scene = new Parser.Race(scene)

		console.log(this.scene)

		this.worldGameObject = GameObject.empty("World")

		this.scene.trackObj = new Track(this.scene.track, 0.2);

		let trackGameObject = new GameObject("Track", this.worldGameObject, this.scene.trackObj)
		ShaderMaterial.create(Shaders.PhongSpotlightTexturedProjectorShader).then(trackMaterial => {
			trackMaterial.setColorTexture("../../Assets/Textures/street4.png")
			trackGameObject.material = trackMaterial
		})

		var bbox = scene.bbox;
		var quad: number[] = [
			bbox[0], bbox[1] - 0.01, bbox[5],
			bbox[3], bbox[1] - 0.01, bbox[5],
			bbox[3], bbox[1] - 0.01, bbox[2],
			bbox[0], bbox[1] - 0.01, bbox[2],
		];

		this.scene.groundObj = new Quad(quad, 10)

		let groundGameObject = new GameObject("Ground", this.worldGameObject, this.scene.groundObj)
		let undergroundGameObject = new GameObject("Underground", this.worldGameObject, this.scene.groundObj)
		undergroundGameObject.transform.position[1] -= 2
		undergroundGameObject.transform.rotation[0] += Math.PI
		ShaderMaterial.create(Shaders.PhongSpotlightTexturedProjectorShader).then(groundMaterial => {
			groundMaterial.setColorTexture("../../Assets/Textures/grass_tile.png")
			groundGameObject.material = groundMaterial
			undergroundGameObject.material = groundMaterial
		})

		this.scene.buildingsObj  = new Array(this.scene.buildings.length);
		this.scene.buildingsObjTex  = new Array(this.scene.buildings.length);
		for (var i = 0; i < this.scene.buildings.length; ++i){  
			this.scene.buildingsObj[i] = new Building(this.scene.buildings[i]);
			
			this.scene.buildingsObjTex[i] = new TexturedFacades(this.scene.buildings[i],0.1);
			this.scene.buildingsObjTex[i].gameObject = new GameObject("Building " + i + " sides", this.worldGameObject, this.scene.buildingsObjTex[i])

			this.scene.buildingsObjTex[i].roof = new TexturedRoof(this.scene.buildings[i],1.0);
			this.scene.buildingsObjTex[i].roof.gameObject = new GameObject("Building " + i + " roof", this.worldGameObject, this.scene.buildingsObjTex[i].roof)
		}

		for(var i = 0; i < this.scene._trees.length; i ++){
			let tree = new Tree("Tree " + i, this.worldGameObject)
			tree.transform.position = this.scene._trees[i].position
		}

		ShaderMaterial.create(Shaders.PhongSpotlightTexturedProjectorShader).then(sidesMaterial => {
			sidesMaterial.setColorTexture("../../Assets/Textures/facade2.jpg")
			
			for(var i = 0; i < this.scene.buildingsObjTex.length; i++){
				this.scene.buildingsObjTex[i].gameObject.material = sidesMaterial
			}
		})

		ShaderMaterial.create(Shaders.PhongSpotlightTexturedProjectorShader).then(sidesMaterial => {
			sidesMaterial.setColorTexture("../../Assets/Textures/roof.jpg")
			
			for(var i = 0; i < this.scene.buildingsObjTex.length; i++){
				this.scene.buildingsObjTex[i].roof.gameObject.material = sidesMaterial
			}
		})
	}

	/*
	initialize the object in the scene
	*/
	private initializeObjects(renderer: Renderer) {
		this.setScene(scene_0)
		this.addCar("mycar")

		this.cameras.push(this.car.findChildWithName("FollowFromUpCamera") as unknown as Camera)
		this.cameras.push(this.car.findChildWithName("ChaseCamera") as unknown as Camera)
		this.cameras.push(new LateChaseCamera(this.car, 10))
		this.cameras.push(new FreeCamera())

		renderer.currentCamera = this.cameras[1]
		renderer.addObjectToScene(this.car)
		renderer.addObjectToScene(this.worldGameObject)

		for(var i = 0; i < this.scene.lamps.length; i++){
			let post = new LampPost("LampPost " + i, null)
			post.transform.position = this.scene.lamps[i].position
			post.transform.position[1] = this.scene.lamps[i].height
			
			renderer.addObjectToScene(post)
		}

		renderer.setDirectionalLight(this.scene.weather.sunLightDirection)

		renderer.setSkybox({
			posX: "../../Assets/Textures/cubemap/posx.jpg",
			negX: "../../Assets/Textures/cubemap/negx.jpg",
			posY: "../../Assets/Textures/cubemap/posy.jpg",
			negY: "../../Assets/Textures/cubemap/negy.jpg",
			posZ: "../../Assets/Textures/cubemap/posz.jpg",
			negZ: "../../Assets/Textures/cubemap/negz.jpg"
		})

		let banner = new Billboard("Banner", "../../Assets/Textures/billboard_1.jpg")
		banner.transform.position[0] = 2
		this.worldGameObject.addChild(banner)

		let banner2 = new Billboard("Banner2", "../../Assets/Textures/billboard_2.png")
		banner.transform.position[0] = 5
		this.worldGameObject.addChild(banner2)
	}
}