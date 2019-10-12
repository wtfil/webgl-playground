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

type AllowType<Obj, Type> = {
    [K in keyof Obj]: Obj[K] extends Type ? K : never
};
export type FieldsOfType<Obj, Type> = AllowType<Obj, Type>[keyof Obj]
