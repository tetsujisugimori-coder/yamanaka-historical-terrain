// Display-only D recipe in existing local easting/northing metres.
// The same color is evaluated by both meshes on the established patch edge.
export const WEST_GATE_FINISH = 'west-gate-continuity-d-v1';
const COLLAR = 22;
const unit = x => Math.max(0, Math.min(1, x));
const smooth = x => { const t = unit(x); return t * t * (3 - 2 * t); };

export function westGateEdgeWeight(east, north, [west, south, eastEdge, northEdge]) {
 const outside = Math.hypot(Math.max(west - east, 0, east - eastEdge), Math.max(south - north, 0, north - northEdge));
 const inside = Math.min(east - west, eastEdge - east, north - south, northEdge - north);
 return 1 - smooth((outside || inside) / COLLAR);
}

export function westGateEdgeColor(east, north, target) {
 // Linear RGB, with low-amplitude terrain color at the scale of the existing grid.
 const grain = .013 * Math.sin(east * .12 + north * .09) * Math.cos(north * .16);
 return target.setRGB(.169 + grain, .221 + grain, .099 + grain * .55);
}

export function westGateRelief(element, east, north, normalY, normalZ) {
 const gate = element === 'wb-gate';
 const moat = element === 'wb-moat';
 if (!gate && !moat && element !== 'wb-bailey') return 1;
 const local = 1 - smooth(Math.hypot((east + 185) / 85, (north + 23) / 75));
 const steep = 1 - unit(Math.abs(normalY));
 // This soft D tonal cue does not cast a shadow or modify normals.
 return 1 + local * (.085 * normalZ - (moat ? .11 : .035) * steep + (gate ? .025 : 0));
}
