import {vec3 as Vec3} from 'gl-matrix';

export interface ProgramProperties {
    rotation: number;
    cameraPosition: Vec3;
    center: Vec3;
    directionalLightVector: Vec3;
    start: number;
    time: number;
    renderWater: boolean;
    renderTerrain: boolean;
}
export interface BufferObject {
    buffers: {
        [key: string]: WebGLBuffer;
    },
    size: number;
    texture: WebGLTexture;
}
export type Program = WebGLProgram & {
    uniforms: {
        [key: string]: WebGLUniformLocation
    },
    attributes: {
        [key: string]: number;
    }
}
