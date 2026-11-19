import type { Plant, PlantStage } from "../types";

const files = import.meta.glob("../assets/plants/*/*.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

/** Every stage image resolves through the config path, never hardcoded in a component. */
export function plantImage(rel: string): string {
  return files[`../assets/${rel}`] ?? "";
}

const stage = (id: string, name: string, description: string, requiredExp: number, plantId: string): PlantStage => ({
  id,
  name,
  description,
  requiredExp,
  image: `plants/${plantId}/${id}.svg`,
});

const DAISY = [0, 40, 100, 190, 300, 440, 620];
const LUSH = [0, 45, 115, 210, 330, 480, 660];
const TREE = [0, 40, 110, 200, 300, 400, 520, 660];
const SUCC = [0, 40, 110, 200, 300, 410, 540];

export const PLANTS: Plant[] = [
  {
    id: "sunflower",
    name: "向日葵",
    description: "喜欢光的植物，茎秆总是朝着太阳的方向缓慢转动。",
    meaning: "沉默的忠诚，以及一直朝着想要的方向。",
    accent: "#f4c542",
    cycle: "7 个成长阶段",
    coverImage: "plants/sunflower/blooming.svg",
    stages: [
      stage("seed", "种子", "一颗沉睡的种子，什么都还看不出来。", DAISY[0], "sunflower"),
      stage("sprout", "萌芽", "嫩芽顶开泥土，第一次见到光。", DAISY[1], "sunflower"),
      stage("seedling", "幼苗", "两片小小的子叶舒展开。", DAISY[2], "sunflower"),
      stage("growing", "生长", "茎一天比一天高，叶片变多。", DAISY[3], "sunflower"),
      stage("bud", "花苞", "花苞在顶端微微低头，正在积蓄。", DAISY[4], "sunflower"),
      stage("blooming", "盛开", "整朵花打开，追逐一整个夏天的阳光。", DAISY[5], "sunflower"),
      stage("fruiting", "结果", "花盘结满种子，是留给下一个季节的礼物。", DAISY[6], "sunflower"),
    ],
  },
  {
    id: "lavender",
    name: "薰衣草",
    description: "细长的花穗在风里轻轻晃，安静但从不停止生长。",
    meaning: "等待、平静，以及在漫长里的耐心。",
    accent: "#9b7bd4",
    cycle: "7 个成长阶段",
    coverImage: "plants/lavender/blooming.svg",
    stages: [
      stage("seed", "种子", "细小的褐色种子，几乎握不住。", LUSH[0], "lavender"),
      stage("sprout", "萌芽", "纤细的芽尖探出土壤。", LUSH[1], "lavender"),
      stage("seedling", "幼苗", "细叶成对生长。", LUSH[2], "lavender"),
      stage("growing", "枝叶生长", "柔软的枝条渐渐密集。", LUSH[3], "lavender"),
      stage("bud", "花穗形成", "顶端结出细小的花穗。", LUSH[4], "lavender"),
      stage("blooming", "紫色花穗盛开", "一片安静而克制的紫。", LUSH[5], "lavender"),
      stage("mature", "成熟植株", "花穗深沉饱满，香气更远。", LUSH[6], "lavender"),
    ],
  },
  {
    id: "cherry-blossom",
    name: "樱花",
    description: "先开花再长叶的树，一年里最动人的只有短短几天。",
    meaning: "短暂也值得全力以赴，以及新的开始。",
    accent: "#f3b7cd",
    cycle: "8 个成长阶段",
    coverImage: "plants/cherry-blossom/blooming.svg",
    stages: [
      stage("seed", "种子", "一颗小小的樱核。", TREE[0], "cherry-blossom"),
      stage("sprout", "萌芽", "细芽破土。", TREE[1], "cherry-blossom"),
      stage("seedling", "幼苗", "幼树抽出第枝条。", TREE[2], "cherry-blossom"),
      stage("growing", "小树", "树形渐渐成形。", TREE[3], "cherry-blossom"),
      stage("branches", "枝干成长", "枝干舒展交错，撑起整片形状。", TREE[4], "cherry-blossom"),
      stage("bud", "花苞形成", "枝头缀满小小的花苞。", TREE[5], "cherry-blossom"),
      stage("blooming", "樱花盛开", "满树粉色，风一过就落一场雪。", TREE[6], "cherry-blossom"),
      stage("fruiting", "果实成熟", "花瓣落下，果实是新的开始。", TREE[7], "cherry-blossom"),
    ],
  },
  {
    id: "lily",
    name: "百合",
    description: "茎秆笔直，六片花瓣向外舒展，从不东倒西歪。",
    meaning: "干净、坚定，以及不喧哗的自信。",
    accent: "#f6f0ea",
    cycle: "7 个成长阶段",
    coverImage: "plants/lily/blooming.svg",
    stages: [
      stage("seed", "种子", "薄薄的鳞片种子。", DAISY[0], "lily"),
      stage("sprout", "萌芽", "青色的芽探出地面。", DAISY[1], "lily"),
      stage("seedling", "幼苗", "细长的叶片向上生长。", DAISY[2], "lily"),
      stage("growing", "生长", "茎秆笔直地立起来。", DAISY[3], "lily"),
      stage("bud", "花苞", "几枚花苞垂立待放。", DAISY[4], "lily"),
      stage("blooming", "盛开", "六片花瓣安静地打开。", DAISY[5], "lily"),
      stage("mature", "成熟", "花谢之后留下种荚。", DAISY[6], "lily"),
    ],
  },
  {
    id: "succulent",
    name: "多肉",
    description: "生长很慢，但每一片叶子都厚实饱满，一滴水都不会浪费。",
    meaning: "把有限的东西用到最好。",
    accent: "#7fbf9a",
    cycle: "7 个成长阶段",
    coverImage: "plants/succulent/rosette.svg",
    stages: [
      stage("seed", "种子", "比芝麻还小的种子。", SUCC[0], "succulent"),
      stage("sprout", "萌芽", "刚刚张开的两片小叶。", SUCC[1], "succulent"),
      stage("seedling", "幼苗", "叶子开始变得厚实。", SUCC[2], "succulent"),
      stage("growing", "生长", "莲座形状渐渐出现。", SUCC[3], "succulent"),
      stage("rosette", "莲座", "叶片层层叠叠如同一朵花。", SUCC[4], "succulent"),
      stage("blooming", "开花", "抽出一根细细的花茎。", SUCC[5], "succulent"),
      stage("mature", "成熟", "饱满而稳定的一株。", SUCC[6], "succulent"),
    ],
  },
  {
    id: "hydrangea",
    name: "绣球花",
    description: "一朵花其实是一整团小花，土壤变了颜色也跟着变。",
    meaning: "被环境塑造，也一起塑造环境。",
    accent: "#8fa8e8",
    cycle: "7 个成长阶段",
    coverImage: "plants/hydrangea/blooming.svg",
    stages: [
      stage("seed", "种子", "细小的种子，需要耐心等。", LUSH[0], "hydrangea"),
      stage("sprout", "萌芽", "两片嫩叶。", LUSH[1], "hydrangea"),
      stage("seedling", "幼苗", "叶片阔大，很有生命力。", LUSH[2], "hydrangea"),
      stage("growing", "生长", "植株渐渐丰满。", LUSH[3], "hydrangea"),
      stage("bud", "花苞", "球形的花苞成形。", LUSH[4], "hydrangea"),
      stage("blooming", "盛开", "一整团蓝紫色的花球。", LUSH[5], "hydrangea"),
      stage("mature", "成熟", "花色沉淀下来，更有层次。", LUSH[6], "hydrangea"),
    ],
  },
  {
    id: "tulip",
    name: "郁金香",
    description: "从球茎里长出来，花期不长，却每年都会准时回来。",
    meaning: "真挚的表达，以及按时兑现的承诺。",
    accent: "#ef6f7c",
    cycle: "7 个成长阶段",
    coverImage: "plants/tulip/blooming.svg",
    stages: [
      stage("seed", "种子", "一颗圆润的球茎。", DAISY[0], "tulip"),
      stage("sprout", "萌芽", "尖细的芽钻出土。", DAISY[1], "tulip"),
      stage("seedling", "幼苗", "叶片挺立向上。", DAISY[2], "tulip"),
      stage("growing", "生长", "花茎笔直地抽长。", DAISY[3], "tulip"),
      stage("bud", "花苞", "尖尖的花苞，层次分明。", DAISY[4], "tulip"),
      stage("blooming", "盛开", "杯形的花朵打开。", DAISY[5], "tulip"),
      stage("mature", "成熟", "花瓣厚实，颜色更深。", DAISY[6], "tulip"),
    ],
  },
  {
    id: "rose",
    name: "玫瑰",
    description: "枝条带刺，但花还是照开不误。",
    meaning: "热爱，也包含被划伤的可能。",
    accent: "#e0616f",
    cycle: "7 个成长阶段",
    coverImage: "plants/rose/blooming.svg",
    stages: [
      stage("seed", "种子", "一颗玫瑰种子，安静等待。", LUSH[0], "rose"),
      stage("sprout", "萌芽", "嫩芽上带着一点红色。", LUSH[1], "rose"),
      stage("seedling", "幼苗", "叶缘有细小的齿。", LUSH[2], "rose"),
      stage("growing", "生长", "花枝渐渐长高。", LUSH[3], "rose"),
      stage("bud", "花苞", "紧实的花苞，被萼片包着。", LUSH[4], "rose"),
      stage("blooming", "盛开", "层层叠叠的花瓣展开。", LUSH[5], "rose"),
      stage("fruiting", "结果", "花谢之后结出果实。", LUSH[6], "rose"),
    ],
  },
];

export const plantById = (id: string) => PLANTS.find((p) => p.id === id);
export const stageOfPlant = (plant: Plant, stageId: string) => plant.stages.find((s) => s.id === stageId) ?? plant.stages[0];
