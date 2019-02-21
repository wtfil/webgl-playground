import {vec3 as Vec3} from 'gl-matrix';

export interface ProgramProperties {
    center: Vec3;
    cameraDistance: number,
    yaw: number,
    pitch: number,
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
    textures: {
        [key: string]: WebGLTexture
    }
}
export type Program = WebGLProgram & {
    uniforms: {
        [key: string]: WebGLUniformLocation
    },
    attributes: {
        [key: string]: number;
    }
}
