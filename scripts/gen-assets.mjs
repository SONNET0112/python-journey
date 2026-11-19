// Generates the plant stage artwork (one independent SVG per stage) + the abstract background.
// Deterministic: same input -> same file, so re-running never churns the repo.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(ROOT, "src/assets");

const leaf = (x, y, len, ang, color, opacity = 1) => {
  // teardrop leaf drawn from its stem attachment point at (x,y), pointing along `ang` degrees
  const r = (ang * Math.PI) / 180;
  const cx = x + Math.cos(r) * len * 0.55;
  const cy = y + Math.sin(r) * len * 0.55;
  return `<path d="M${x.toFixed(1)},${y.toFixed(1)} Q${(cx - Math.sin(r) * len * 0.42).toFixed(1)},${(cy + Math.cos(r) * len * 0.42).toFixed(1)} ${(x + Math.cos(r) * len).toFixed(1)},${(y + Math.sin(r) * len).toFixed(1)} Q${(cx + Math.sin(r) * len * 0.42).toFixed(1)},${(cy - Math.cos(r) * len * 0.42).toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)} Z" fill="${color}" opacity="${opacity}"/>`;
};

const petals = (cx, cy, count, len, width, color, rot = 0, opacity = 1) => {
  let s = "";
  for (let i = 0; i < count; i++) {
    const a = rot + (360 / count) * i;
    s += `<g transform="rotate(${a} ${cx} ${cy})"><path d="M${cx},${cy} C${cx - width},${cy - len * 0.35} ${cx - width * 0.55},${cy - len} ${cx},${cy - len} C${cx + width * 0.55},${cy - len} ${cx + width},${cy - len * 0.35} ${cx},${cy} Z" fill="${color}" opacity="${opacity}"/></g>`;
  }
  return s;
};

const stem = (x, y0, h, color, w = 6) =>
  `<path d="M${x},${y0} C${x - 8},${y0 - h * 0.45} ${x + 8},${y0 - h * 0.7} ${x},${y0 - h}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;

const soil = () => `<ellipse cx="256" cy="432" rx="132" ry="24" fill="rgba(255,255,255,0.05)"/><ellipse cx="256" cy="428" rx="92" ry="15" fill="rgba(120,90,200,0.18)"/>`;

const seedShape = (color = "#c9a172") =>
  `<g transform="rotate(-18 256 418)"><ellipse cx="256" cy="418" rx="26" ry="17" fill="${color}"/><ellipse cx="249" cy="413" rx="9" ry="5" fill="rgba(255,255,255,0.45)"/><path d="M238,422 Q256,428 274,422" stroke="rgba(0,0,0,0.18)" stroke-width="2" fill="none"/></g>`;

/** Generic flowering plant. p drives every geometric change, so no stage reuses a shape. */
function flowering(spec, s) {
  const h = s.h;
  const base = 430;
  let out = soil();
  if (s.seedOnly) return out + seedShape(spec.seedColor);
  out += stem(256, base, h, spec.stem, s.stemW ?? 6);
  const n = s.leaves;
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / (n + 1);
    const y = base - h * t;
    const dir = i % 2 === 0 ? -1 : 1;
    const len = (s.leafLen ?? 52) * (0.55 + 0.55 * t);
    out += leaf(256, y, len, dir < 0 ? 200 + 25 * (1 - t) : -20 - 25 * (1 - t), spec.leaf);
    out += leaf(256, y, len, dir < 0 ? 160 : 20, spec.leaf, 0.55);
  }
  const topY = base - h;
  if (s.state === "bud") {
    out += `<path d="M256,${topY} C244,${topY - 14} 246,${topY - 40} 256,${topY - 46} C266,${topY - 40} 268,${topY - 14} 256,${topY} Z" fill="${spec.bud}"/>`;
    out += `<path d="M256,${topY - 2} C250,${topY - 14} 252,${topY - 30} 256,${topY - 34}" stroke="rgba(0,0,0,0.15)" stroke-width="2" fill="none"/>`;
  } else if (s.state === "open") {
    const r = s.flowerR;
    out += petals(256, topY, spec.petals, r, r * 0.42, spec.petal, spec.rot ?? 0);
    out += petals(256, topY, spec.petals, r * 0.72, r * 0.3, spec.petal2 ?? spec.petal, (spec.rot ?? 0) + 180 / spec.petals, 0.9);
    out += `<circle cx="256" cy="${topY}" r="${(r * 0.3).toFixed(1)}" fill="${spec.core}"/>`;
  } else if (s.state === "fruit") {
    const r = s.flowerR * 0.8;
    out += petals(256, topY, spec.petals, r, r * 0.4, spec.petal, spec.rot ?? 0, 0.45);
    out += `<circle cx="256" cy="${topY}" r="${(r * 0.62).toFixed(1)}" fill="${spec.core}"/>`;
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const rr = (r * 0.55) * Math.sqrt((i % 7) / 7);
      out += `<circle cx="${(256 + Math.cos(a) * rr).toFixed(1)}" cy="${(topY + Math.sin(a) * rr).toFixed(1)}" r="2.6" fill="rgba(0,0,0,0.28)"/>`;
    }
  }
  return out;
}

function tree(spec, s) {
  const base = 436;
  let out = soil();
  if (s.seedOnly) return out + seedShape(spec.seedColor);
  const h = s.h;
  out += `<path d="M256,${base} C250,${base - h * 0.4} 262,${base - h * 0.6} 256,${base - h}" stroke="${spec.stem}" stroke-width="${s.trunkW}" fill="none" stroke-linecap="round"/>`;
  const branches = s.branches;
  for (let i = 0; i < branches; i++) {
    const t = 0.45 + (i / Math.max(branches, 1)) * 0.5;
    const y = base - h * t;
    const dir = i % 2 === 0 ? -1 : 1;
    const len = h * 0.26 * (0.6 + t * 0.7);
    out += `<path d="M256,${y} Q${256 + dir * len * 0.6},${y - len * 0.5} ${256 + dir * len},${y - len * 0.85}" stroke="${spec.stem}" stroke-width="${Math.max(2, s.trunkW * 0.45)}" fill="none" stroke-linecap="round"/>`;
    const bx = 256 + dir * len;
    const by = y - len * 0.85;
    if (s.state === "bud") {
      out += `<circle cx="${bx}" cy="${by}" r="7" fill="${spec.bud}"/>`;
    } else if (s.state === "open" || s.state === "fruit") {
      for (let j = 0; j < 7; j++) {
        const a = (j / 7) * Math.PI * 2;
        const rr = 12 + (j % 3) * 6;
        out += `<circle cx="${(bx + Math.cos(a) * rr).toFixed(1)}" cy="${(by + Math.sin(a) * rr * 0.8).toFixed(1)}" r="${s.state === "open" ? 8 : 6}" fill="${s.state === "open" ? spec.petal : spec.petal2 ?? spec.petal}" opacity="${s.state === "open" ? 0.95 : 0.8}"/>`;
      }
    }
  }
  const cl = s.leafLen ?? 46;
  for (let i = 0; i < s.leaves; i++) {
    const t = 0.3 + (i / Math.max(s.leaves, 1)) * 0.55;
    const y = base - h * t;
    out += leaf(256, y, cl * (0.7 + t * 0.5), i % 2 ? -35 : 215, spec.leaf, 0.9);
  }
  return out;
}

function succulent(spec, s) {
  let out = soil();
  if (s.seedOnly) return out + seedShape(spec.seedColor);
  const cx = 256;
  const cy = 424;
  const rings = s.rings;
  for (let r = rings; r >= 0; r--) {
    const n = 5 + r * 3;
    const len = (s.rosetteR + r * 26) * 0.55;
    const scale = 1 - r * 0.18;
    for (let i = 0; i < n; i++) {
      const a = (360 / n) * i + r * 11;
      const px = cx + Math.cos((a * Math.PI) / 180) * (r * 16);
      const py = cy + Math.sin((a * Math.PI) / 180) * (r * 7) - r * 4;
      out += `<g transform="rotate(${a + 90} ${px} ${py})"><ellipse cx="${px}" cy="${py - len * scale * 0.6}" rx="${(len * 0.3 * scale).toFixed(1)}" ry="${(len * scale).toFixed(1)}" fill="${r % 2 ? spec.leaf2 : spec.leaf}" opacity="${0.8 + 0.04 * r}"/><ellipse cx="${px}" cy="${py - len * scale * 0.6}" rx="${(len * 0.09).toFixed(1)}" ry="${(len * scale * 0.7).toFixed(1)}" fill="rgba(255,255,255,0.18)"/></g>`;
    }
  }
  if (s.state === "open") {
    out += stem(cx, cy - rings * 12, 62, spec.stem, 4);
    out += `<path d="M${cx},${cy - rings * 12 - 62} C${cx - 10},${cy - rings * 12 - 50} ${cx - 10},${cy - rings * 12 - 30} ${cx},${cy - rings * 12 - 26} C${cx + 10},${cy - rings * 12 - 30} ${cx + 10},${cy - rings * 12 - 50} ${cx},${cy - rings * 12 - 62} Z" fill="${spec.petal}"/>`;
  }
  return out;
}

const PLANTS = [
  {
    id: "sunflower",
    name: "向日葵",
    kind: "flowering",
    spec: { stem: "#5f9e63", leaf: "#69a86a", seedColor: "#c9a172", petals: 16, petal: "#f4c542", petal2: "#f7d96b", core: "#8a5a2b", bud: "#b9c46a", rot: -8 },
    stages: [
      ["seed", "种子", "一颗沉睡的种子", { seedOnly: true }],
      ["sprout", "萌芽", "嫩芽顶开泥土", { h: 42, leaves: 2, leafLen: 26 }],
      ["seedling", "幼苗", "两片小叶子展开", { h: 92, leaves: 4, leafLen: 38 }],
      ["growing", "生长", "茎秆挺拔向上", { h: 168, leaves: 6, leafLen: 56, stemW: 8 }],
      ["bud", "花苞", "花苞在顶端微微低垂", { h: 214, leaves: 6, leafLen: 58, stemW: 9, state: "bud" }],
      ["blooming", "盛开", "整朵花追逐阳光", { h: 226, leaves: 7, leafLen: 62, stemW: 9, state: "open", flowerR: 66 }],
      ["fruiting", "结果", "花盘里结满种子", { h: 226, leaves: 7, leafLen: 62, stemW: 9, state: "fruit", flowerR: 74 }],
    ],
  },
  {
    id: "lavender",
    name: "薰衣草",
    kind: "flowering",
    spec: { stem: "#6f9c6a", leaf: "#8fb08a", seedColor: "#b89a70", petals: 12, petal: "#9b7bd4", petal2: "#b79ae8", core: "#7a5aa8", bud: "#8c74bd" },
    stages: [
      ["seed", "种子", "细小的褐色种子", { seedOnly: true }],
      ["sprout", "萌芽", "纤细的芽尖", { h: 34, leaves: 2, leafLen: 18, stemW: 3 }],
      ["seedling", "幼苗", "细叶成对生长", { h: 78, leaves: 4, leafLen: 26, stemW: 3 }],
      ["growing", "枝叶生长", "柔软枝条渐渐密集", { h: 138, leaves: 8, leafLen: 34, stemW: 4 }],
      ["bud", "花穗形成", "顶端结出细小花穗", { h: 176, leaves: 8, leafLen: 34, stemW: 4, state: "bud" }],
      ["blooming", "紫色花穗盛开", "一片安静的紫", { h: 186, leaves: 9, leafLen: 36, stemW: 4, state: "open", flowerR: 40, rot: 6 }],
      ["mature", "成熟植株", "花穗深沉而饱满", { h: 190, leaves: 9, leafLen: 36, stemW: 4, state: "fruit", flowerR: 42 }],
    ],
  },
  {
    id: "cherry-blossom",
    name: "樱花",
    kind: "tree",
    spec: { stem: "#7d5b4b", leaf: "#8fae74", seedColor: "#a98563", petal: "#f3b7cd", petal2: "#e78aa8", bud: "#e6a7c0", petals: 5 },
    stages: [
      ["seed", "种子", "一颗小小的樱核", { seedOnly: true }],
      ["sprout", "萌芽", "细芽破土", { h: 36, branches: 0, leaves: 2, trunkW: 4 }],
      ["seedling", "幼苗", "幼树抽出枝条", { h: 86, branches: 2, leaves: 4, trunkW: 6 }],
      ["growing", "小树", "树形渐成", { h: 148, branches: 3, leaves: 6, trunkW: 9 }],
      ["branches", "枝干成长", "枝干舒展交错", { h: 196, branches: 5, leaves: 8, trunkW: 12 }],
      ["bud", "花苞形成", "枝头缀满花苞", { h: 206, branches: 5, leaves: 8, trunkW: 12, state: "bud" }],
      ["blooming", "樱花盛开", "满树粉色", { h: 210, branches: 5, leaves: 8, trunkW: 12, state: "open" }],
      ["fruiting", "果实成熟", "花瓣落下，果实是新的开始", { h: 210, branches: 5, leaves: 9, trunkW: 12, state: "fruit" }],
    ],
  },
  {
    id: "lily",
    name: "百合",
    kind: "flowering",
    spec: { stem: "#5c9a5f", leaf: "#7cb673", seedColor: "#c4a77e", petals: 6, petal: "#f6f0ea", petal2: "#e6d7f0", core: "#e2b44a", bud: "#dcd6e8" },
    stages: [
      ["seed", "种子", "薄薄的鳞片种子", { seedOnly: true }],
      ["sprout", "萌芽", "青芽探出", { h: 40, leaves: 2, leafLen: 24 }],
      ["seedling", "幼苗", "细长叶片", { h: 96, leaves: 4, leafLen: 40 }],
      ["growing", "生长", "茎秆笔直", { h: 178, leaves: 7, leafLen: 52 }],
      ["bud", "花苞", "三枚花苞垂立", { h: 226, leaves: 8, leafLen: 52, state: "bud" }],
      ["blooming", "盛开", "六片花瓣向外舒展", { h: 240, leaves: 8, leafLen: 54, state: "open", flowerR: 58 }],
      ["mature", "成熟", "花谢之后留下种荚", { h: 244, leaves: 8, leafLen: 54, state: "fruit", flowerR: 62 }],
    ],
  },
  {
    id: "succulent",
    name: "多肉",
    kind: "succulent",
    spec: { leaf: "#7fbf9a", leaf2: "#6aa988", stem: "#79a06a", petal: "#f6c3d2", seedColor: "#b99a72" },
    stages: [
      ["seed", "种子", "比芝麻更小的种子", { seedOnly: true }],
      ["sprout", "萌芽", "刚刚张开的两片小叶", { rings: 0, rosetteR: 22 }],
      ["seedling", "幼苗", "叶子厚实饱满", { rings: 1, rosetteR: 30 }],
      ["growing", "生长", "莲座逐渐成形", { rings: 2, rosetteR: 36 }],
      ["rosette", "莲座", "叶片层叠如花", { rings: 3, rosetteR: 42 }],
      ["blooming", "开花", "抽出细细的花茎", { rings: 3, rosetteR: 42, state: "open" }],
      ["mature", "成熟", "饱满而稳定的一株", { rings: 4, rosetteR: 46 }],
    ],
  },
  {
    id: "hydrangea",
    name: "绣球花",
    kind: "flowering",
    spec: { stem: "#5f9560", leaf: "#6fa96b", seedColor: "#bd9c73", petals: 10, petal: "#8fa8e8", petal2: "#b5c4f4", core: "#d8e2fb", bud: "#9db2e0" },
    stages: [
      ["seed", "种子", "细小的种子", { seedOnly: true }],
      ["sprout", "萌芽", "两片嫩叶", { h: 38, leaves: 2, leafLen: 26 }],
      ["seedling", "幼苗", "叶片阔大", { h: 92, leaves: 4, leafLen: 44 }],
      ["growing", "生长", "植株丰满", { h: 150, leaves: 7, leafLen: 56 }],
      ["bud", "花苞", "球形花苞成形", { h: 190, leaves: 7, leafLen: 56, state: "bud" }],
      ["blooming", "盛开", "一整团蓝紫色的花球", { h: 198, leaves: 8, leafLen: 58, state: "open", flowerR: 74 }],
      ["mature", "成熟", "花色渐渐沉稳", { h: 202, leaves: 8, leafLen: 58, state: "fruit", flowerR: 76 }],
    ],
  },
  {
    id: "tulip",
    name: "郁金香",
    kind: "flowering",
    spec: { stem: "#5e9a63", leaf: "#79b070", seedColor: "#c2a078", petals: 6, petal: "#ef6f7c", petal2: "#f4909a", core: "#7a2f3c", bud: "#e8607a" },
    stages: [
      ["seed", "种子", "球茎一样的种子", { seedOnly: true }],
      ["sprout", "萌芽", "尖细的芽", { h: 42, leaves: 2, leafLen: 28 }],
      ["seedling", "幼苗", "叶片挺立", { h: 104, leaves: 3, leafLen: 46 }],
      ["growing", "生长", "花茎笔直", { h: 176, leaves: 4, leafLen: 54 }],
      ["bud", "花苞", "花苞尖尖，层次分明", { h: 208, leaves: 4, leafLen: 54, state: "bud" }],
      ["blooming", "盛开", "杯形的花朵打开", { h: 218, leaves: 4, leafLen: 56, state: "open", flowerR: 46 }],
      ["mature", "成熟", "花瓣厚实，颜色更深", { h: 220, leaves: 4, leafLen: 56, state: "fruit", flowerR: 44 }],
    ],
  },
  {
    id: "rose",
    name: "玫瑰",
    kind: "flowering",
    spec: { stem: "#4f7a4a", leaf: "#5f8f57", seedColor: "#b08a63", petals: 8, petal: "#e0616f", petal2: "#f0879a", core: "#8e2f3f", bud: "#cf5468" },
    stages: [
      ["seed", "种子", "一颗玫瑰种子", { seedOnly: true }],
      ["sprout", "萌芽", "嫩芽带一点红", { h: 40, leaves: 2, leafLen: 24 }],
      ["seedling", "幼苗", "叶缘带着细齿", { h: 96, leaves: 4, leafLen: 40 }],
      ["growing", "生长", "花枝渐长", { h: 172, leaves: 7, leafLen: 50 }],
      ["bud", "花苞", "紧实的花苞", { h: 210, leaves: 7, leafLen: 50, state: "bud" }],
      ["blooming", "盛开", "层层叠叠的花瓣", { h: 216, leaves: 8, leafLen: 52, state: "open", flowerR: 58, rot: 12 }],
      ["fruiting", "结果", "花谢之后结出果实", { h: 218, leaves: 8, leafLen: 52, state: "fruit", flowerR: 54 }],
    ],
  },
];

// zoom keeps early stages readable at card size: a 40px sprout in a 512 canvas is invisible once scaled down
const wrap = (body, zoom = 1) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs>
  <radialGradient id="glow" cx="50%" cy="46%" r="52%">
    <stop offset="0%" stop-color="rgba(255,255,255,0.14)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
  </radialGradient>
</defs>
<ellipse cx="256" cy="300" rx="190" ry="190" fill="url(#glow)"/>
<g transform="translate(256,432) scale(${zoom.toFixed(3)}) translate(-256,-432)">
${body}
</g>
</svg>
`;

const zoomFor = (kind, p) => {
  if (p.seedOnly) return 2.1;
  if (kind === "succulent") return p.rings <= 1 ? 2.0 : p.rings === 2 ? 1.7 : 1.45;
  const h = p.h ?? 100;
  return Math.max(1.15, Math.min(2.4, 300 / Math.max(h, 80)));
};

let count = 0;
for (const p of PLANTS) {
  const dir = resolve(OUT, "plants", p.id);
  mkdirSync(dir, { recursive: true });
  for (const [id, , , params] of p.stages) {
    const body = p.kind === "tree" ? tree(p.spec, params) : p.kind === "succulent" ? succulent(p.spec, params) : flowering(p.spec, params);
    writeFileSync(resolve(dir, `${id}.svg`), wrap(body, zoomFor(p.kind, params)));
    count++;
  }
}

// abstract blue-purple background (no UI elements, just atmosphere)
const bg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000">
<defs>
  <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0a0d24"/><stop offset="45%" stop-color="#141033"/><stop offset="100%" stop-color="#07101f"/>
  </linearGradient>
  <radialGradient id="b1" cx="20%" cy="15%" r="55%"><stop offset="0%" stop-color="#4b3cff" stop-opacity="0.55"/><stop offset="100%" stop-color="#4b3cff" stop-opacity="0"/></radialGradient>
  <radialGradient id="b2" cx="80%" cy="20%" r="45%"><stop offset="0%" stop-color="#8a3cff" stop-opacity="0.42"/><stop offset="100%" stop-color="#8a3cff" stop-opacity="0"/></radialGradient>
  <radialGradient id="b3" cx="65%" cy="88%" r="55%"><stop offset="0%" stop-color="#1b6bff" stop-opacity="0.35"/><stop offset="100%" stop-color="#1b6bff" stop-opacity="0"/></radialGradient>
  <radialGradient id="b4" cx="12%" cy="82%" r="40%"><stop offset="0%" stop-color="#1f8f6f" stop-opacity="0.22"/><stop offset="100%" stop-color="#1f8f6f" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1600" height="1000" fill="url(#base)"/>
<rect width="1600" height="1000" fill="url(#b1)"/>
<rect width="1600" height="1000" fill="url(#b2)"/>
<rect width="1600" height="1000" fill="url(#b3)"/>
<rect width="1600" height="1000" fill="url(#b4)"/>
<g opacity="0.5">
${Array.from({ length: 46 }, (_, i) => {
  const x = (i * 137) % 1600;
  const y = (i * 271) % 1000;
  const r = 1 + ((i * 7) % 3) * 0.8;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#dcd8ff" opacity="${0.15 + ((i % 5) * 0.08).toFixed(2)}"/>`;
}).join("\n")}
</g>
<g opacity="0.25" stroke="#8f86ff" fill="none">
  <ellipse cx="1230" cy="180" rx="260" ry="180" stroke-width="1"/>
  <ellipse cx="300" cy="720" rx="320" ry="220" stroke-width="1"/>
</g>
</svg>
`;
mkdirSync(resolve(OUT, "backgrounds"), { recursive: true });
writeFileSync(resolve(OUT, "backgrounds", "cosmos.svg"), bg);
console.log(`generated ${count} plant stage images + 1 background`);
