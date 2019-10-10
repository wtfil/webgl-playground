import Vec3 = require('gl-matrix/vec3');
import {ProgramProperties} from './types';

const DEFAULT_PROPERTIES: ProgramProperties = {
    center: Vec3.fromValues(4, 4, 175),
    cameraPosition: Vec3.fromValues(720, 74, 69),

    directionalLightVector: Vec3.fromValues(0, 0, -1),
    sunPosition: Vec3.fromValues(0, 0, -1),
    start: Date.now(),
    sunTime: 12 * 3600 * 1000,
    time: 0,
    renderWater: true,
    renderTerrain: true,
    useReflection: true,
    useRefraction: true,
    
    renderSun: true,
    autoSunMove: true
};

export function initProperties(): ProgramProperties {
    return DEFAULT_PROPERTIES
}