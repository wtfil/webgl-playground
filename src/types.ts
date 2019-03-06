import {vec3 as Vec3} from 'gl-matrix';

export interface ProgramProperties {
    center: Vec3;
    cameraPosition: Vec3,
    directionalLightVector: Vec3;
    start: number;
    time: number;
    renderWater: boolean;
    renderTerrain: boolean;
    useRefraction: boolean;
    useReflection: boolean;
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
