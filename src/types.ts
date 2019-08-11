import {vec3 as Vec3} from 'gl-matrix';

export interface ProgramProperties {
    center: Vec3;
    cameraPosition: Vec3,
    sunPosition: Vec3;
    renderSun: boolean;
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
    },
    framebuffers: {
        [key: string]: WebGLFramebuffer
    }
}
export interface Program {
    program: WebGLProgram;
    gl: WebGLRenderingContext;
    uniforms: {
        [key: string]: WebGLUniformLocation;
    },
    attributes: {
        [key: string]: number;
    }
}
