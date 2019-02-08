const st = process.argv[2];
const [lon1, lat1, lon2, lat2] = st.split(',').map(Number);

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);  // deg2rad below
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}


const lat = (lat1 + lat2) / 2;
const lon = (lon1 + lon2) / 2;
const width = getDistanceFromLatLonInKm(lat1, lon1, lat1, lon2);
const height = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon1);

console.log({lat, lon, width, height})