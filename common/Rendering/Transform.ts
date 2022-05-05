import { GameObject } from "./GameObject.js"
import * as glMatrix from "../libs/gl-matrix/dist/esm/index.js"

export class Transform{
    //pivotAdjustment: vec3
    position: vec3
    rotation: vec3
    scaling: vec3
    parent: Transform
    gameObject: GameObject = null

    constructor(pivotAdjustment: vec3, position: vec3, rotation: vec3, scaling: vec3){
        //this.pivotAdjustment = pivotAdjustment
        this.position = position
        this.rotation = rotation
        this.scaling = scaling
    }

    public static empty(): Transform{
        return new Transform(
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [1, 1, 1]
        )
    }

    getLocalMatrix(): mat4{
        var M                 = glMatrix.mat4.create();
		var rotate_transform  = glMatrix.mat4.create();
		var translate_matrix  = glMatrix.mat4.create();
		var scale_matrix      = glMatrix.mat4.create();
        
		glMatrix.mat4.fromScaling(scale_matrix, this.scaling);
		glMatrix.mat4.mul(M, scale_matrix, M);
        
        var rotation = glMatrix.quat.create()
        glMatrix.quat.rotateY(rotation, rotation, this.rotation[1])
        glMatrix.quat.rotateX(rotation, rotation, this.rotation[0])
        glMatrix.quat.rotateZ(rotation, rotation, this.rotation[2])
        //glMatrix.quat.fromEuler(rotation, this.rotation[0], this.rotation[1], this.rotation[2])
        glMatrix.mat4.fromQuat(rotate_transform, rotation)
		glMatrix.mat4.mul(M, rotate_transform, M)
		/*
        glMatrix.mat4.fromTranslation(translate_matrix, this.pivotAdjustment);
		glMatrix.mat4.mul(M, translate_matrix, M);
		*/

		glMatrix.mat4.fromTranslation(translate_matrix, this.position);
		glMatrix.mat4.mul(M, translate_matrix, M);

        return M
    }

    applyLocalTransform(matrix: mat4, to: mat4): mat4{
        return glMatrix.mat4.mul(matrix, to, this.getLocalMatrix())
    }

    getWorldMatrix(): mat4{
        if(this.parent){
            return glMatrix.mat4.mul(glMatrix.mat4.create(), this.parent.getLocalMatrix(), this.getLocalMatrix())
        }else{
            return this.getLocalMatrix()
        }
    }
}