import Vec3 = require('gl-matrix/vec3');
import {ProgramProperties} from './types';
import {sunTimeToString} from './create-sun';

const DEFAULT_PROPERTIES: ProgramProperties = {
    center: Vec3.fromValues(0, 0, 0),
    cameraPosition: Vec3.fromValues(478, 494, 69),

    directionalLightVector: Vec3.fromValues(0, 0, -1),
    sunPosition: Vec3.fromValues(0, 0, -1),
    start: Date.now(),
    sunTime: 9 * 3600 * 1000,
    time: 0,
    renderWater: true,
    renderTerrain: true,
    useReflection: true,
    useRefraction: false,
    renderSun: true
};
const LOCALSTORAGE_KEY = 'wp-program-params';

const arrToString = (arr: Float32Array) => {
    return Array.from(arr)
        .map(i => {
            const sign = i > 0 ? '+' : '-';
            return sign + Math.abs(i).toFixed(1)
        })
        .join(', ')
}

export function initProperties(): ProgramProperties {
    const item = localStorage.getItem(LOCALSTORAGE_KEY);
    const properties = item ?
        JSON.parse(item) :
        DEFAULT_PROPERTIES;
    return {
        ...properties,
        start: Date.now()
    }
}

export function saveProperties(properties: ProgramProperties) {
    const prepared = {
        ...properties,
        center: Array.from(properties.center),
        cameraPosition: Array.from(properties.cameraPosition),
    }
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(prepared));
}

export function renderProperties(node: HTMLTableElement, properties: ProgramProperties) {

    const info = [
        {
            title: 'sun position',
            value: arrToString(properties.sunPosition)
        },
        {
            title: 'sun time',
            value: sunTimeToString(properties.sunTime)
        },
        {
            title: 'altitude',
            value: (properties.altitude! * 180 / Math.PI).toFixed(2)
        },
        {
            title: 'azimuth',
            value: (properties.azimuth! * 180 / Math.PI).toFixed(2)
        },
        {
            title: 'camera',
            control: 'a d w s wheel mouse',
            value: arrToString(properties.cameraPosition)
        },
        {
            title: 'center',
            control: 'a d w s wheel mouse',
            value: arrToString(properties.center)
        },
        {
            title: 'terrain',
            control: '1',
            value: properties.renderTerrain
        },
        {
            title: 'water',
            control: '2',
            value: properties.renderWater
        },
        {
            title: 'use refraction',
            control: '3',
            value: properties.useRefraction
        },
        {
            title: 'use reflection',
            control: '4',
            value: properties.useReflection
        },
        {
            title: 'render sun disk',
            control: '5',
            value: properties.renderSun
        },
    ];
    const columns = ['title', 'control', 'value'];
    const body = node.querySelector('tbody')!;
    body.innerHTML = '';

    info.forEach((item: any) => {
        const tr = document.createElement('tr');
        columns.forEach(key => {
            const td = document.createElement('td');
            td.innerText = key in item ? item[key] : '';
            tr.appendChild(td);
        })
        body.appendChild(tr);
    })
}