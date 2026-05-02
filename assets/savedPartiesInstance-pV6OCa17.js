import{c as n,Q as c,R as S,T as l,U as p}from"./index-51RYLA31.js";/**
 * @license lucide-react v0.510.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],y=n("user",P),U=["User","Users","Shield","Sword","Wand2","Star","Crown","Flame","Zap","Skull","Heart","Axe","Sparkles","Swords","Ghost"],u=()=>c()(S(r=>({parties:[],lastUsedPartyId:void 0,addParty:e=>r(t=>{const s={...e,savedAt:new Date().toISOString()},a=t.parties.findIndex(o=>o.id===e.id);if(a===-1)return{parties:[...t.parties,s]};const i=[...t.parties];return i[a]=s,{parties:i}}),updateParty:(e,t)=>r(s=>({parties:s.parties.map(a=>a.id===e?{...a,...t,id:a.id,savedAt:new Date().toISOString()}:a)})),removeParty:e=>r(t=>({parties:t.parties.filter(s=>s.id!==e),lastUsedPartyId:t.lastUsedPartyId===e?void 0:t.lastUsedPartyId})),setLastUsedPartyId:e=>r({lastUsedPartyId:e})}),{name:"saved-parties-store",storage:l(()=>localStorage)}));let d=null;const I=()=>(d===null&&(d=u()),d),f=r=>p(I(),r);export{U as P,y as U,f as u};
//# sourceMappingURL=savedPartiesInstance-pV6OCa17.js.map
