import React, { useId, useState } from 'react';
// Optional local generated artwork: src/assets/elite-trophy.webp. Vector fallback is always available.
const artwork = import.meta.glob('../assets/elite-trophy.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const trophyArtwork = artwork['../assets/elite-trophy.webp'];
/** Original reusable, faceted tournament trophy; independently composited in each scene. */
export function EliteTrophy({className = ''}: {className?: string}) {
 const uid = useId();
 const metal = uid + '-metal', dark = uid + '-dark';
 const [imageFailed,setImageFailed] = useState(false);
 if(trophyArtwork && !imageFailed) return <img src={trophyArtwork} onError={()=>setImageFailed(true)} alt="كأس صراع النخبة" className={className+' object-contain'} decoding="async" />;
 return <svg viewBox="0 0 240 280" role="img" aria-label="كأس صراع النخبة" className={className}>
 <defs>
                <linearGradient id={metal} x1="0" x2="1"><stop stopColor="#63400f"/><stop offset=".19" stopColor="#efc56b"/><stop offset=".36" stopColor="#fff1bb"/><stop offset=".51" stopColor="#af7929"/><stop offset=".73" stopColor="#f7d88a"/><stop offset="1" stopColor="#57360b"/></linearGradient>
                <linearGradient id={dark} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#f9db92"/><stop offset="1" stopColor="#77501c"/></linearGradient>
              </defs>
              <path d="M55 36 24 30 15 47 28 105 73 135 82 118 47 91 39 52 60 58M185 36 216 30 225 47 212 105 167 135 158 118 193 91 201 52 180 58" fill={`url(#${metal})`} stroke="#ffe4a1" strokeWidth="1"/>
              <path d="M47 26 193 26 180 115 145 159 132 165 132 208 158 224 158 235 82 235 82 224 108 208 108 165 95 159 60 115Z" fill={`url(#${metal})`} stroke="#f8d98d" strokeWidth="1.5"/>
              <path d="M47 26 93 52 108 165 95 159 60 115Z" fill="#fff5cf" fillOpacity=".28"/>
              <path d="M193 26 147 52 132 165 145 159 180 115Z" fill="#352006" fillOpacity=".30"/>
              <path d="M47 26 120 44 193 26 186 17 54 17Z" fill="#ffe5a6" stroke="#b78232"/>
              <path d="M120 57 148 90 120 123 92 90Z" fill="#171d15" stroke="#ffdf8c" strokeWidth="2"/><path d="M108 78 132 78 124 90 132 103 108 103 116 90Z" fill="#f2c66c"/>
              <path d="M82 235H158L180 250V267H60V250Z" fill={`url(#${dark})`} stroke="#e9bb69"/><path d="M60 250H180V267H60Z" fill="#171812" stroke="#d2a252"/><path d="M89 254H151V263H89Z" fill="#d6b36c"/>
 <path d="M98 132h44" stroke="#ffe3a0" strokeWidth="1.2" opacity=".8"/>
 <text x="120" y="145" fontSize="9" fontFamily="Orbitron, sans-serif" fontWeight="900" textAnchor="middle" fill="#46310c">CE</text>
 </svg>;
}
