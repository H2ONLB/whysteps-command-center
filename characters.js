/* WhySteps Command Center characters (Option A, chosen by Hiba 23 Nov 2026).
   Drawn in code (SVG). The founder's character is an illustration only: no
   photo is stored anywhere. Each department has its own outfit and tool;
   reviewers wear the outfit of the builders they check, plus a magnifying
   glass; the three AI workspaces are robots in their own colours. */
window.WSChars = (() => {
  const SKIN = ['#F5C9A8', '#E2A97E', '#C58B62', '#8D5A3B', '#F1D3BC', '#B97A55'];
  const HAIR = ['#2C2C2A', '#412402', '#633806', '#712B13', '#1A1A1A', '#4B1528', '#444441'];
  const STYLES = ['short', 'curly', 'bun', 'long', 'wrap'];
  const OUTFIT = {
    product: { top: '#185FA5', prop: 'clip', label: 'Navy blazer, plans in hand' },
    technology: { top: '#5F5E5A', prop: 'laptop', label: 'Grey hoodie and laptop' },
    design: { top: '#D4537E', prop: 'pencil', hat: 'beret', label: 'Pink beret and pencil' },
    accessibility: { top: '#D4537E', prop: 'pencil', label: 'Design team outfit' },
    teaching: { top: '#D85A30', prop: 'book', label: 'Cardigan and a book' },
    'marketing-and-support': { top: '#E24B4A', prop: 'mega', label: 'Red jacket, megaphone' },
    'privacy-lawyer': { top: '#2C2C2A', prop: 'shield', label: 'Dark suit and a shield' },
    'child-safety-and-ai-ethics': { top: '#2C2C2A', prop: 'shield', label: 'Dark suit and a shield' },
    architect: { top: '#0C447C', prop: 'plan', hat: 'hard', label: 'Hard hat and blueprint' },
    specialists: { top: '#0F6E56', prop: 'book', hat: 'grad', label: 'Graduation cap and a book' }
  };
  const ROBOT = { Hiba: ['#0F6E56', 'CH'], Onsi: ['#185FA5', 'CO'], ChatGPT: ['#534AB7', 'GP'], Live: ['#C2410C', 'LIVE'] };
  const HATS = {
    hard: '<path d="M31 22 Q45 6 59 22 Z" fill="#EF9F27"/><rect x="28" y="21" width="34" height="4" rx="2" fill="#BA7517"/>',
    grad: '<polygon points="45,8 66,16 45,24 24,16" fill="#2C2C2A"/><rect x="38" y="18" width="14" height="6" fill="#2C2C2A"/><line x1="62" y1="17" x2="62" y2="28" stroke="#EF9F27" stroke-width="1.5"/>',
    beret: '<ellipse cx="45" cy="17" rx="15" ry="6" fill="#D4537E"/><circle cx="45" cy="11" r="2" fill="#D4537E"/>'
  };
  const PROPS = {
    laptop: '<rect x="56" y="78" width="22" height="14" rx="2" fill="#5F5E5A"/><rect x="58" y="80" width="18" height="10" fill="#85B7EB"/>',
    book: '<rect x="58" y="76" width="16" height="20" rx="1" fill="#D85A30"/><rect x="60" y="78" width="12" height="16" fill="#FAECE7"/>',
    pencil: '<rect x="60" y="66" width="5" height="26" rx="1" fill="#EF9F27" transform="rotate(20 62 79)"/>',
    mega: '<polygon points="58,80 76,72 76,94 58,86" fill="#E24B4A"/>',
    shield: '<path d="M66 74 L78 78 Q78 92 66 98 Q54 92 54 78Z" fill="#1D9E75"/>',
    glass: '<circle cx="68" cy="80" r="7" fill="#E6F1FB" stroke="#2C2C2A" stroke-width="2"/><line x1="73" y1="85" x2="80" y2="93" stroke="#2C2C2A" stroke-width="3"/>',
    clip: '<rect x="58" y="74" width="16" height="22" rx="2" fill="#B4B2A9"/><rect x="60" y="78" width="12" height="16" fill="#fff"/><rect x="62" y="72" width="8" height="4" rx="1" fill="#5F5E5A"/>',
    plan: '<rect x="56" y="78" width="24" height="16" fill="#B5D4F4" stroke="#185FA5"/><path d="M60 82h8v8h8" fill="none" stroke="#185FA5"/>',
    paper: '<rect x="60" y="74" width="15" height="19" rx="1" fill="#fff" stroke="#888780" stroke-width=".7" transform="rotate(-10 67 83)"/><path d="M63 80h8M63 84h8M63 88h5" stroke="#B4B2A9" stroke-width="1" transform="rotate(-10 67 83)"/>'
  };
  function hairSVG(style, hair) {
    if (style === 'long') return `<path d="M27 40 Q25 14 45 12 Q65 14 63 40 L66 74 Q45 80 24 74Z" fill="${hair}"/>`;
    if (style === 'bun') return `<circle cx="45" cy="13" r="7" fill="${hair}"/><path d="M32 30 Q33 17 45 17 Q57 17 58 30 Q52 23 45 24 Q38 23 32 30Z" fill="${hair}"/>`;
    if (style === 'curly') return `<g fill="${hair}"><circle cx="35" cy="22" r="7"/><circle cx="45" cy="17" r="8"/><circle cx="55" cy="22" r="7"/><circle cx="31" cy="30" r="5"/><circle cx="59" cy="30" r="5"/></g>`;
    if (style === 'wrap') return `<path d="M30 34 Q29 14 45 14 Q61 14 60 34 L61 48 Q45 52 29 48Z" fill="${hair}"/>`;
    return `<path d="M32 31 Q31 16 45 16 Q59 16 58 31 Q55 22 45 22 Q35 22 32 31Z" fill="${hair}"/>`;
  }
  /* A role's look: outfit from its department; skin and hair vary by role number. */
  function look(n, dept) {
    const review = /^review-/.test(dept || '');
    const base = OUTFIT[review ? dept.slice(7) : dept] || OUTFIT.product;
    return { ...base, prop: review ? 'glass' : base.prop, review, skin: SKIN[n % SKIN.length], hair: HAIR[(n * 3) % HAIR.length], style: STYLES[(n * 7) % STYLES.length],
      label: review ? base.label.split(',')[0] + ' + magnifying glass (reviewer)' : base.label };
  }
  function person(o, extraProp) {
    const h = hairSVG(o.style, o.hair);
    return `<ellipse cx="45" cy="114" rx="22" ry="4" fill="#000" opacity="0.08"/>${o.style === 'long' ? h : ''}<path d="M24 112 Q24 74 45 72 Q66 74 66 112Z" fill="${o.top}"/>` +
      `<rect x="40" y="58" width="10" height="14" fill="${o.skin}"/><circle cx="45" cy="38" r="17" fill="${o.skin}"/><circle cx="39" cy="40" r="1.6" fill="#2C2C2A"/><circle cx="51" cy="40" r="1.6" fill="#2C2C2A"/>` +
      `<path d="M40 47 Q45 51 50 47" stroke="#993556" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="35" cy="45" r="2.5" fill="#F0997B" opacity=".45"/><circle cx="55" cy="45" r="2.5" fill="#F0997B" opacity=".45"/>` +
      `${o.style !== 'long' ? h : ''}${o.hat ? HATS[o.hat] : ''}${PROPS[extraProp || o.prop] || ''}`;
  }
  function robot(key, extraProp) {
    const [c, label] = ROBOT[key] || ['#888780', 'AI'];
    return `<ellipse cx="45" cy="114" rx="22" ry="4" fill="#000" opacity="0.08"/><line x1="45" y1="12" x2="45" y2="22" stroke="${c}" stroke-width="2"/><circle cx="45" cy="10" r="4" fill="${c}"/>` +
      `<rect x="26" y="22" width="38" height="32" rx="10" fill="${c}"/><rect x="31" y="29" width="28" height="16" rx="6" fill="#fff"/><circle cx="39" cy="37" r="3" fill="#2C2C2A"/><circle cx="51" cy="37" r="3" fill="#2C2C2A"/>` +
      `<rect x="28" y="60" width="34" height="46" rx="10" fill="${c}"/><text x="45" y="88" font-size="11" text-anchor="middle" fill="#fff" font-family="sans-serif">${label}</text>${PROPS[extraProp] || ''}`;
  }
  /* The founder: long warm-brown hair with soft bangs, dark green top, silver necklace, approval stamp. */
  const FOUNDER = '<path d="M21 34 Q19 6 45 5 Q71 6 69 34 L72 92 Q58 98 45 96 Q32 98 18 92Z" fill="#5A3420"/>' +
    '<path d="M24 100 Q24 76 45 74 Q66 76 66 100 L66 118 L24 118Z" fill="#1F4A3E"/><rect x="40" y="60" width="10" height="15" fill="#F1C9AE"/>' +
    '<ellipse cx="45" cy="38" rx="16" ry="19" fill="#F1C9AE"/><path d="M29 30 Q31 14 45 14 Q59 14 61 30 Q56 24 50 26 Q45 22 40 26 Q34 24 29 30Z" fill="#6B3E25"/>' +
    '<path d="M27 32 Q26 52 30 66 L25 64 Q22 46 27 32Z M63 32 Q64 52 60 66 L65 64 Q68 46 63 32Z" fill="#6B3E25"/>' +
    '<path d="M38 41 q2 -2 4 0 M48 41 q2 -2 4 0" stroke="#3B2416" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '<path d="M40 50 Q45 54 50 50" stroke="#A3405A" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="35" cy="47" r="2.6" fill="#F0997B" opacity=".4"/><circle cx="55" cy="47" r="2.6" fill="#F0997B" opacity=".4"/>' +
    '<path d="M36 76 Q45 86 54 76" stroke="#D3D1C7" stroke-width="1" fill="none"/><circle cx="45" cy="84" r="2.2" fill="#F1EFE8" stroke="#B4B2A9" stroke-width=".6"/>' +
    '<rect x="62" y="86" width="12" height="12" rx="2" fill="#993C1D"/><rect x="59" y="98" width="18" height="5" rx="1" fill="#712B13"/>';
  const svg = (inner, w, label) => `<svg viewBox="0 0 90 120" width="${w || 72}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${inner}</svg>`;
  return { look, person, robot, FOUNDER, svg, OUTFIT };
})();
