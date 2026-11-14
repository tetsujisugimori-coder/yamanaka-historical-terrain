// Existing detail routes only. Unknown IDs never fall back to an unrelated model.
const routes={
 reconstruction:['nm-bailey','nm-moat','nm-rampart','nm-passage','nm-transition','wb-bailey','wb-gate','wb-moat','wb-building','sc-palisade','sc-gate','sc-vegetation','sc-flags','sc-people'],
 inner:['ic-lookout','ic-bridge','ic-koguchi'],
 connected:['dc-gate','dc-fence-north','dc-fence-south','dc-rail-north','dc-rail-south']
};
export function overviewDestination(id){return Object.entries(routes).find(([,ids])=>ids.includes(id))?.[0]??null;}
