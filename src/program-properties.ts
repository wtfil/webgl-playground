import Vec3 = require('gl-matrix/vec3');
import {ProgramProperties} from './types';

const DEFAULT_PROPERTIES: ProgramProperties = {
    center: Vec3.fromValues(-462, -206, 157),
    cameraPosition: Vec3.fromValues(248, -326, 58),

    directionalLightVector: Vec3.fromValues(0, 0, -1),
    sunPosition: Vec3.fromValues(0, 0, -1),
    start: Date.now(),
    sunTime: 12 * 3600 * 1000,
    time: 0,
    renderWater: false,
    renderTerrain: true,
    useReflection: true,
    useRefraction: true,
    
    renderSun: true,
    autoSunMove: false
};

export function initProperties(): ProgramProperties {
    return DEFAULT_PROPERTIES
}