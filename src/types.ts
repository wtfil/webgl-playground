import {vec3 as Vec3} from 'gl-matrix';

export interface ProgramProperties {
    center: Vec3;
    cameraPosition: Vec3,
    sunPosition: Vec3;
    directionalLightVector: Vec3;
    directionalLightColor: Vec3;
    renderSun: boolean;
    start: number;
    time: number;
    renderWater: boolean;
    renderTerrain: boolean;
    useRefraction: boolean;
    useReflection: boolean;

    autoSunMove: boolean;
    sunTime: number;
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

export type Unpacked<T> =
    T extends (infer U)[] ? U :
    T extends (...args: any[]) => infer U ? U :
    T extends Promise<infer U> ? U :
    T;