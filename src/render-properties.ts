import {ProgramProperties} from './types';

const arrToString = (arr: Float32Array) => {
    return Array.from(arr)
        .map(i => {
            const sign = i > 0 ? '+' : '-';
            return sign + Math.abs(i).toFixed(1)
        })
        .join(', ')
}

export function renderProperties(node: HTMLTableElement, properties: ProgramProperties) {

    const info = [
        {
            title: 'center',
            control: 'a d w s',
            value: arrToString(properties.center)
        },
        {
            title: 'camera',
            control: 'a d w s wheel',
            value: arrToString(properties.cameraPosition)
        },
        {
            title: 'ligth',
            control: '[ ]',
            value: arrToString(properties.directionalLightVector)
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
        }
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