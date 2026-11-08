const clamp=n=>Math.min(1,Math.max(0,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
export function headingFor(dx,dz){return Math.atan2(dx,dz)}
// The figures' forward axis is local +Z. Their heading follows their velocity.
export function parkingApproach(progress){const p=clamp(progress),travel=ease(p/.72);return{x:-16.6,z:34-4.5*travel,heading:headingFor(0,-4.5),moving:p<.72}}
export function blockedCarAdvance(progress){return .55*ease(progress/.35)}
