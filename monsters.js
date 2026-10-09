/* 原創數字怪獸（全部原創設計，非任何既有作品角色）— 資料在 data.js 的 monsters */
(function(){
const M = (window.GAME_DATA && window.GAME_DATA.monsters) || [];
const INK = "#24305E";
function shade(hex, f){
  const n=parseInt(hex.slice(1),16); let r=n>>16,g=(n>>8)&255,b=n&255;
  const t=f<0?0:255, p=Math.abs(f);
  r=Math.round((t-r)*p+r); g=Math.round((t-g)*p+g); b=Math.round((t-b)*p+b);
  return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
function bodyOf(shape){
  switch(shape){
    case "tall": return {cx:60,cy:66,rx:28,ry:36};
    case "wide": return {cx:60,cy:72,rx:40,ry:28};
    case "pear": return {cx:60,cy:68,rx:33,ry:33};
    default:     return {cx:60,cy:68,rx:34,ry:32};
  }
}
const S3 = ink => `stroke="${ink}" stroke-width="3" stroke-linejoin="round"`;
function star(cx,cy,r,fill,ink){
  let p=""; for(let i=0;i<10;i++){const a=Math.PI/5*i-Math.PI/2, rr=i%2?r*0.45:r; p+=(i?"L":"M")+(cx+rr*Math.cos(a)).toFixed(1)+" "+(cy+rr*Math.sin(a)).toFixed(1);}
  return `<path d="${p}Z" fill="${fill}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
}
function ears(m,b,ink,c1,c2){
  const top=b.cy-b.ry, L=b.cx-b.rx*0.55, R=b.cx+b.rx*0.55, s=S3(ink);
  switch(m.ears){
    case "cat": return `<path d="M${L-12} ${top+12} L${L-6} ${top-16} L${L+12} ${top+4} Z" fill="${c1}" ${s}/><path d="M${R+12} ${top+12} L${R+6} ${top-16} L${R-12} ${top+4} Z" fill="${c1}" ${s}/>`;
    case "bunny": return `<ellipse cx="${L}" cy="${top-14}" rx="8" ry="22" fill="${c1}" ${s} transform="rotate(-12 ${L} ${top-14})"/><ellipse cx="${R}" cy="${top-14}" rx="8" ry="22" fill="${c1}" ${s} transform="rotate(12 ${R} ${top-14})"/><ellipse cx="${L}" cy="${top-14}" rx="3.5" ry="14" fill="${c2}" transform="rotate(-12 ${L} ${top-14})"/><ellipse cx="${R}" cy="${top-14}" rx="3.5" ry="14" fill="${c2}" transform="rotate(12 ${R} ${top-14})"/>`;
    case "bear": return `<circle cx="${L-4}" cy="${top+6}" r="11" fill="${c1}" ${s}/><circle cx="${R+4}" cy="${top+6}" r="11" fill="${c1}" ${s}/><circle cx="${L-4}" cy="${top+6}" r="5" fill="${c2}"/><circle cx="${R+4}" cy="${top+6}" r="5" fill="${c2}"/>`;
    case "antenna": return `<path d="M${L+6} ${top+6} Q${L-6} ${top-14} ${L-10} ${top-20}" fill="none" ${s}/><path d="M${R-6} ${top+6} Q${R+6} ${top-14} ${R+10} ${top-20}" fill="none" ${s}/><circle cx="${L-10}" cy="${top-21}" r="6" fill="#FFD23F" ${s}/><circle cx="${R+10}" cy="${top-21}" r="6" fill="#FFD23F" ${s}/>`;
    case "leaf": return `<path d="M60 ${top+4} C46 ${top-6} 44 ${top-24} 54 ${top-30} C60 ${top-18} 62 ${top-8} 60 ${top+4} Z" fill="#5CC46E" ${s}/><path d="M60 ${top+4} C72 ${top-4} 78 ${top-18} 74 ${top-26} C66 ${top-18} 62 ${top-8} 60 ${top+4} Z" fill="#8ADB7A" ${s}/>`;
    case "horn": return `<path d="M${L} ${top+8} L${L-4} ${top-14} L${L+10} ${top+4} Z" fill="#FFF1C9" ${s}/><path d="M${R} ${top+8} L${R+4} ${top-14} L${R-10} ${top+4} Z" fill="#FFF1C9" ${s}/>`;
    case "fin": return `<path d="M${b.cx-10} ${top+4} Q${b.cx} ${top-22} ${b.cx+16} ${top+4} Z" fill="${shade(c1,-0.15)}" ${s}/>`;
    case "wing": return `<path d="M${b.cx-b.rx+2} ${b.cy} q-22 -6 -20 -24 q10 4 24 10 Z" fill="${c2}" ${s}/><path d="M${b.cx+b.rx-2} ${b.cy} q22 -6 20 -24 q-10 4 -24 10 Z" fill="${c2}" ${s}/>`;
    default: return "";
  }
}
function tail(m,b,ink,c1){
  const x=b.cx+b.rx-4, y=b.cy+b.ry*0.35, s=S3(ink);
  switch(m.tail){
    case "flame": return `<path d="M${x} ${y} C${x+16} ${y-2} ${x+20} ${y-18} ${x+14} ${y-30} C${x+26} ${y-24} ${x+30} ${y-6} ${x+18} ${y+8} Z" fill="#FFB13D" ${s}/><path d="M${x+6} ${y+2} C${x+14} ${y-2} ${x+18} ${y-10} ${x+16} ${y-18} C${x+22} ${y-10} ${x+20} ${y} ${x+12} ${y+6} Z" fill="#FF6B3D"/>`;
    case "fish": return `<path d="M${x-2} ${y} L${x+22} ${y-14} L${x+18} ${y+2} L${x+24} ${y+16} Z" fill="${shade(c1,-0.12)}" ${s}/>`;
    case "round": return `<circle cx="${x+6}" cy="${y+2}" r="9" fill="${shade(c1,0.35)}" ${s}/>`;
    case "swirl": return `<path d="M${x} ${y} q20 4 20 -14 q0 -10 -10 -10 q-8 0 -8 8" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round"/><path d="M${x} ${y} q20 4 20 -14 q0 -10 -10 -10 q-8 0 -8 8" fill="none" stroke="${c1}" stroke-width="4.5" stroke-linecap="round"/>`;
    default: return "";
  }
}
// 肚子花紋（數字主題）
function mark(m,b,ink){
  const y=b.cy+b.ry*0.3;
  switch(m.mark){
    case "dots": { let o=""; for(let i=0;i<5;i++) o+=`<circle cx="${b.cx-12+i*6}" cy="${y-3}" r="2.2" fill="${shade(m.c1,-0.1)}"/><circle cx="${b.cx-12+i*6}" cy="${y+4}" r="2.2" fill="${shade(m.c1,-0.1)}"/>`; return o; }
    case "ten": return `<rect x="${b.cx-15}" y="${y-8}" width="30" height="16" rx="5" fill="#fff" stroke="${ink}" stroke-width="2"/><text x="${b.cx}" y="${y+5}" text-anchor="middle" font-size="13" font-weight="800" fill="${ink}" font-family="Baloo 2, sans-serif">10</text>`;
    case "rod": { let o=`<rect x="${b.cx-4}" y="${y-14}" width="8" height="28" rx="2" fill="#5CC46E" stroke="${ink}" stroke-width="2"/>`; for(let i=1;i<5;i++) o+=`<line x1="${b.cx-4}" x2="${b.cx+4}" y1="${y-14+i*5.6}" y2="${y-14+i*5.6}" stroke="${ink}" stroke-width="1"/>`; return o; }
    case "flat": return `<rect x="${b.cx-11}" y="${y-11}" width="22" height="22" rx="3" fill="#FF9F43" stroke="${ink}" stroke-width="2"/><path d="M${b.cx-11} ${y} h22 M${b.cx} ${y-11} v22" stroke="${ink}" stroke-width="1"/>`;
    case "coin": return `<circle cx="${b.cx}" cy="${y}" r="10" fill="#FFD23F" stroke="${ink}" stroke-width="2"/><text x="${b.cx}" y="${y+4.5}" text-anchor="middle" font-size="11" font-weight="800" fill="${ink}" font-family="Baloo 2, sans-serif">10</text>`;
    default: return "";
  }
}
function fxMap(m,b,ink){
  const top=b.cy-b.ry, s=S3(ink);
  return {
    flame:`<path d="M60 ${top+2} c-8 -8 -4 -18 0 -22 c4 6 10 8 6 18 Z" fill="#FF8A3D" ${s}/>`,
    leaf:`<circle cx="${b.cx-b.rx+8}" cy="${b.cy-6}" r="6" fill="#FF8FB8" ${s}/>`,
    bolt:`<path d="M${b.cx+b.rx-6} ${b.cy-18} l10 0 l-6 10 l8 0 l-14 16 l4 -12 l-7 0 Z" fill="#FFD23F" ${s}/>`,
    bubble:`<circle cx="${b.cx-b.rx-6}" cy="${top+10}" r="6" fill="#fff" fill-opacity=".7" ${s}/><circle cx="${b.cx-b.rx-14}" cy="${top-4}" r="4" fill="#fff" fill-opacity=".7" stroke="${ink}" stroke-width="2"/>`,
    cloud:`<path d="M${b.cx-b.rx-4} ${b.cy+b.ry-4} a8 8 0 0 1 10 -10 a10 10 0 0 1 18 4 a7 7 0 0 1 -2 12 h-22 a6 6 0 0 1 -4 -6 Z" fill="#fff" ${s}/>`,
    moon:`<path d="M${b.cx+b.rx-2} ${top+2} a12 12 0 1 0 10 16 a9 9 0 1 1 -10 -16 Z" fill="#FFE27A" ${s}/>`,
    star: star(b.cx-b.rx+4, top+8, 8, "#FFD23F", ink),
    flower:`<g transform="translate(${b.cx-b.rx+10} ${top+8})"><circle r="4" cx="0" cy="-6" fill="#fff" ${s}/><circle r="4" cx="6" cy="0" fill="#fff" ${s}/><circle r="4" cx="0" cy="6" fill="#fff" ${s}/><circle r="4" cx="-6" cy="0" fill="#fff" ${s}/><circle r="3.5" fill="#FFD23F" ${s}/></g>`,
    shell:`<path d="M${b.cx-14} ${b.cy+6} a14 12 0 0 1 28 0 Z" fill="#FFE0DB" ${s}/>`,
    glow:`<circle cx="${b.cx}" cy="${b.cy+b.ry-6}" r="9" fill="#F7FF7A" ${s}/>`,
    rainbow:`<path d="M${b.cx-20} ${top+2} a20 18 0 0 1 40 0" fill="none" stroke="#FF6F61" stroke-width="4"/><path d="M${b.cx-15} ${top+2} a15 13 0 0 1 30 0" fill="none" stroke="#FFD23F" stroke-width="4"/><path d="M${b.cx-10} ${top+2} a10 8 0 0 1 20 0" fill="none" stroke="#5CC46E" stroke-width="4"/>`,
    dots:`<circle cx="${b.cx-b.rx-2}" cy="${top+6}" r="4" fill="#FF6B8B" ${s}/><circle cx="${b.cx-b.rx-10}" cy="${top+16}" r="3" fill="#FFD23F" stroke="${ink}" stroke-width="2"/><circle cx="${b.cx-b.rx+2}" cy="${top-6}" r="3" fill="#2EC4B6" stroke="${ink}" stroke-width="2"/>`,
    cube:`<g transform="translate(${b.cx+b.rx-8} ${top-4})"><path d="M0 0 l9 -5 l9 5 l-9 5 Z" fill="#FFE27A" ${s}/><path d="M0 0 v10 l9 5 v-10 Z" fill="#FFD23F" ${s}/><path d="M18 0 v10 l-9 5 v-10 Z" fill="#F2B233" ${s}/></g>`,
    one:`<g transform="translate(${b.cx+b.rx-4} ${top-2})"><circle r="11" fill="#FFF" ${s}/><text y="5.5" text-anchor="middle" font-size="16" font-weight="900" fill="#E2487A" font-family="Baloo 2, sans-serif">1</text></g>`,
    zero:`<ellipse cx="${b.cx+b.rx-2}" cy="${top+2}" rx="8" ry="11" fill="none" stroke="${ink}" stroke-width="7"/><ellipse cx="${b.cx+b.rx-2}" cy="${top+2}" rx="8" ry="11" fill="none" stroke="#FFD23F" stroke-width="3.5"/>`,
    flat:`<g transform="translate(${b.cx-b.rx-6} ${top})"><rect width="18" height="18" rx="2" fill="#FF9F43" ${s}/><path d="M0 9 h18 M9 0 v18" stroke="${ink}" stroke-width="1.2"/></g>`,
    crown:`<path d="M${b.cx-12} ${top+2} v-12 l6 6 l6 -9 l6 9 l6 -6 v12 Z" fill="#B9B2A6" ${s}/>`,
    ruler:`<g transform="translate(${b.cx-b.rx-10} ${b.cy-4}) rotate(-25)"><rect width="30" height="9" rx="2" fill="#FFE27A" ${s}/><path d="M6 0 v4 M12 0 v5 M18 0 v4 M24 0 v5" stroke="${ink}" stroke-width="1.5"/></g>`,
    coin:`<g transform="translate(${b.cx+b.rx-2} ${top})"><circle r="10" fill="#FFD23F" ${s}/><text y="4" text-anchor="middle" font-size="10" font-weight="900" fill="${ink}" font-family="Baloo 2, sans-serif">$</text></g>`,
    mushroom:`<g transform="translate(60 ${top+2})"><path d="M-14 0 a14 12 0 0 1 28 0 Z" fill="#FF6F61" ${s}/><circle cx="-5" cy="-6" r="2.5" fill="#fff"/><circle cx="5" cy="-4" r="2" fill="#fff"/></g>`,
  };
}
function extra(m,b,ink,stage){
  if(stage<2) return "";
  let out = fxMap(m,b,ink)[m.fx]||"";
  const top=b.cy-b.ry;
  if(stage>=3){
    out += `<path d="M${b.cx-14} ${top-2} l4 -14 l6 8 l4 -12 l4 12 l6 -8 l4 14 Z" fill="#FFD23F" ${S3(ink)}/>`;
    out = star(14,22,7,"#FFF3A0",ink)+star(106,30,6,"#FFF3A0",ink)+star(100,104,5,"#FFF3A0",ink)+out;
  }
  return out;
}
function egg(m, opts){
  const sil=opts.silhouette, c=sil?"#C9CFE6":m.c1;
  const crack = opts.crack ? `<path d="M36 70 l8 -6 l6 6 l8 -8 l6 6 l8 -6 l8 6" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` : "";
  return `<svg viewBox="0 0 120 120" class="mon egg" role="img" aria-label="怪獸蛋"><ellipse cx="60" cy="112" rx="26" ry="5" fill="#24305E" opacity=".12"/>
  <path d="M60 18 C86 18 96 60 96 78 C96 98 80 110 60 110 C40 110 24 98 24 78 C24 60 34 18 60 18 Z" fill="#FFFDF5" stroke="${INK}" stroke-width="3.5"/>
  <circle cx="46" cy="56" r="8" fill="${c}"/><circle cx="72" cy="44" r="6" fill="${c}"/><circle cx="70" cy="82" r="10" fill="${c}"/><circle cx="44" cy="92" r="5" fill="${c}"/>${crack}</svg>`;
}
// stage: 0 蛋、1 幼年、2 成長、3 完全體；opts.silhouette 剪影、opts.sleepy 想睡覺、opts.crack 蛋快孵了
function draw(id, stage, opts){
  opts=opts||{};
  const m = M.find(x=>x.id===id) || M[0];
  if(stage===0) return egg(m, opts);
  const ink = m.ink||INK, sil = opts.silhouette, sleepy = opts.sleepy && !sil;
  const c1 = sil?"#C9CFE6":m.c1, c2 = sil?"#C9CFE6":m.c2, K = sil?"#9AA3C7":ink;
  const b = bodyOf(m.shape);
  const sc = stage===1?0.78:stage===2?0.92:1.0;
  const eyeR = stage===1?6.5:5.5, ey=b.cy-b.ry*0.18, ex=b.rx*0.38;
  let face;
  if (sil) face = `<text x="60" y="${b.cy+10}" text-anchor="middle" font-size="34" font-weight="800" fill="#fff" font-family="Baloo 2, sans-serif">?</text>`;
  else if (sleepy) face = `<path d="M${b.cx-ex-6} ${ey} q6 5 12 0 M${b.cx+ex-6} ${ey} q6 5 12 0" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>
    <ellipse cx="${b.cx}" cy="${ey+11}" rx="3.5" ry="2.5" fill="${INK}"/>
    <text x="${b.cx+b.rx-2}" y="${b.cy-b.ry-4}" font-size="16" font-weight="900" fill="#5B3FD1" font-family="Baloo 2, sans-serif">z</text><text x="${b.cx+b.rx+8}" y="${b.cy-b.ry-14}" font-size="21" font-weight="900" fill="#5B3FD1" font-family="Baloo 2, sans-serif">Z</text>`;
  else face = `<circle cx="${b.cx-ex}" cy="${ey}" r="${eyeR}" fill="${INK}"/><circle cx="${b.cx+ex}" cy="${ey}" r="${eyeR}" fill="${INK}"/>
    <circle cx="${b.cx-ex+2}" cy="${ey-2.5}" r="2.2" fill="#fff"/><circle cx="${b.cx+ex+2}" cy="${ey-2.5}" r="2.2" fill="#fff"/>
    <ellipse cx="${b.cx-ex-6}" cy="${ey+10}" rx="5" ry="3" fill="#FF8FA3" opacity=".7"/><ellipse cx="${b.cx+ex+6}" cy="${ey+10}" rx="5" ry="3" fill="#FF8FA3" opacity=".7"/>
    <path d="M${b.cx-6} ${ey+9} q6 6 12 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
  const g = `${sil?"":tail(m,b,K,c1)}${ears(m,b,K,c1,c2)}
    <ellipse cx="${b.cx}" cy="${b.cy}" rx="${b.rx}" ry="${b.ry}" fill="${c1}" stroke="${K}" stroke-width="3.5"/>
    <ellipse cx="${b.cx}" cy="${b.cy+b.ry*0.3}" rx="${b.rx*0.62}" ry="${b.ry*0.55}" fill="${c2}"/>
    ${sil?"":mark(m,b,K)}
    <ellipse cx="${b.cx-b.rx*0.55}" cy="${b.cy+b.ry-2}" rx="9" ry="6" fill="${c1}" stroke="${K}" stroke-width="3"/>
    <ellipse cx="${b.cx+b.rx*0.55}" cy="${b.cy+b.ry-2}" rx="9" ry="6" fill="${c1}" stroke="${K}" stroke-width="3"/>
    ${face}${sil?"":extra(m,b,K,stage)}`;
  const label = sil ? "還沒遇到的怪獸" : m.zh;
  return `<svg viewBox="0 0 120 120" class="mon${sleepy?" sleepy":""}" role="img" aria-label="${label}"><ellipse cx="60" cy="112" rx="30" ry="5" fill="#24305E" opacity=".12"/><g transform="translate(60 112) scale(${sc}) translate(-60 -112)">${g}</g></svg>`;
}
window.MONSTERS = { list:M, draw, get:id=>M.find(x=>x.id===id) };
})();
