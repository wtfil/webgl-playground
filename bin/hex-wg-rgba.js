const hex = process.argv[2];
const rgba = hex
    .split(/(.{2})/)
    .filter(Boolean)
    .map(v => parseInt(v, 16) / 255)
    .concat(1)
    .map(v => v.toFixed(2))
    .join(', ')

console.log(`vec4(${rgba})`)