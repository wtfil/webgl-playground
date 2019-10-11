import Vec3 = require('gl-matrix/vec3');
import {ProgramProperties} from './types';

const LOCAL_STORAGE_KEY = 'dev-properties';

const DEFAULT_PROPERTIES: ProgramProperties = {
    center: Vec3.fromValues(106, -461, 93),
    cameraPosition: Vec3.fromValues(-341, 106, 169),

    directionalLightVector: Vec3.fromValues(0, 0, 0),
    directionalLightColor: Vec3.fromValues(0, 0, 0),
    sunPosition: Vec3.fromValues(0, 0, -1),
    start: Date.now(),
    sunTime: 1 * 3600 * 1000,
    time: 0,
    renderWater: true,
    renderTerrain: true,
    useReflection: true,
    useRefraction: true,
    
    renderSun: true,
    autoSunMove: true
};

export function initProperties(): ProgramProperties {
    const props = localStorage.getItem(LOCAL_STORAGE_KEY);
    return props ? {
        ...DEFAULT_PROPERTIES,
        ...JSON.parse(props)
    } : DEFAULT_PROPERTIES
}