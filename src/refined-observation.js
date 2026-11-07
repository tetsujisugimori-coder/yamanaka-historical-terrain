/** Apply only explicit, matching support updates. A station with horizontal
 * lookDown semantics must not accidentally opt in to target-height semantics. */
export function refineObservationMetadata(meta,updates){
 if(!Array.isArray(updates)||new Set(updates.map(x=>x.id)).size!==updates.length)throw Error('地形改訂の観察地点データが不正です');
 const result=structuredClone(meta);
 for(const u of updates){const st=result.stations.find(x=>x.id===u.id);if(!st||JSON.stringify(st.eye)!==JSON.stringify(u.eye)||![u.groundHeight,u.lookTargetHeight].every(Number.isFinite))throw Error('改訂地形の支持位置が一致しません');st.groundHeight=u.groundHeight;if(st.lookTargetHeight!==undefined||st.lookHeightOffset!==undefined){if(!Number.isFinite(st.lookHeightOffset))throw Error('観察目標の高さ指定が不完全です');st.lookTargetHeight=u.lookTargetHeight;}}
 return result;
}
