import * as glMatrix from "./gl-matrix/dist/esm/index.js"

export class MatrixStack {
	m = glMatrix.mat4.create();
	_l  = 1;
	_m  = this.m;
	_s  = [ this.m ];

	get size(): number {
		return this._l;
	}

	get matrix(): mat4 {
		return (this._m as number[]).slice();
	}

	get inverse(): mat4 {
		return ((glMatrix.mat4.invert(glMatrix.mat4.create(),this._m) as number[]).slice()) ;
	}

	get transpose(): mat4 {
		return ((glMatrix.mat4.transpose(glMatrix.mat4.create(),this._m) as number[]).slice() );
	}

	get inverseTranspose(): mat4 {
		return ((glMatrix.mat4.transpose(glMatrix.mat4.create(), this.inverse) as number[]).slice()) ;
	}


	push(): void {
		var m = (this._m as number[]).slice();
		this._s.push(m);
		this._l++;
		this._m = m;
	}

	pop (): mat4 {
		if (this._l <= 1) return;
		this._s.pop();
		this._l--;
		this._m = this._s[this._l - 1];
	}

	load (m): void {
		var m1 = m.slice();
		this._s[this._l - 1] = m1;
		this._m = m1;
	}

	loadIdentity(): void {
		var m = glMatrix.mat4.create();
		this._s[this._l - 1] = m;
		this._m = m;
	}

	multiply (m): void {
		glMatrix.mat4.multiply(this._m,this._m, m);
	}
}