import Vec3 = require('gl-matrix/vec3');
import {ProgramProperties} from './types';

const LOCAL_STORAGE_KEY = 'dev-properties';

const DEFAULT_PROPERTIES: ProgramProperties = {
    center: Vec3.fromValues(-462, -206, 157),
    cameraPosition: Vec3.fromValues(248, -326, 58),

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
    const props = localStorage.getItem(LOCAL_STORAGE_KEY);
    return props ? {
        ...DEFAULT_PROPERTIES,
        ...JSON.parse(props)
    } : DEFAULT_PROPERTIES
}