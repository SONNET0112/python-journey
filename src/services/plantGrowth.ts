import type { Plant, PlantAdoption, PlantGrowthRecord, PlantStage } from "../types";

/** EXP sources — capped per day so a single marathon session cannot skip stages. */
export const EXP = {
  perTask: 3,
  taskDayCap: 21,
  record: 8,
  summary: 12,
  module: 25,
  project: 80,
  stage: 120,
};

export function resolveStage(plant: Plant, exp: number): PlantStage {
  let current = plant.stages[0];
  for (const s of plant.stages) if (exp >= s.requiredExp) current = s;
  return current;
}

export function nextStage(plant: Plant, exp: number): PlantStage | null {
  return plant.stages.find((s) => s.requiredExp > exp) ?? null;
}

export function stageProgress(plant: Plant, exp: number) {
  const current = resolveStage(plant, exp);
  const next = plant.stages.find((s) => s.requiredExp > current.requiredExp) ?? null;
  const span = next ? next.requiredExp - current.requiredExp : 1;
  const done = Math.min(1, Math.max(0, (exp - current.requiredExp) / span));
  return { current, next, done, remaining: next ? next.requiredExp - exp : 0 };
}

export function newAdoption(plant: Plant, date: string): PlantAdoption {
  const first = plant.stages[0];
  return {
    plantId: plant.id,
    adoptedAt: date,
    currentStageId: first.id,
    currentExp: 0,
    totalWateringCount: 0,
    growthRecords: [
      {
        date,
        type: "adopt",
        title: `领养了${plant.name}`,
        detail: `一颗${first.name}，从这里开始。`,
        stageId: first.id,
        image: first.image,
      },
    ],
  };
}

const record = (date: string, type: PlantGrowthRecord["type"], title: string, detail: string, stage: PlantStage): PlantGrowthRecord => ({
  date,
  type,
  title,
  detail,
  stageId: stage.id,
  image: stage.image,
});

export interface GrowthResult {
  adoption: PlantAdoption;
  upgraded: PlantStage | null;
  fromStage: PlantStage;
  toStage: PlantStage;
}

/** Adds exp and, if a threshold was crossed, records the stage change. */
export function grow(adoption: PlantAdoption, plant: Plant, exp: number, date: string, detail: string): GrowthResult {
  const fromStage = resolveStage(plant, adoption.currentExp);
  const total = adoption.currentExp + Math.max(0, Math.round(exp));
  const toStage = resolveStage(plant, total);
  const upgraded = toStage.id !== fromStage.id ? toStage : null;
  const growthRecords = [...adoption.growthRecords];
  growthRecords.push(record(date, "exp", `+${Math.round(exp)} 成长经验`, detail, toStage));
  if (upgraded) {
    growthRecords.push(record(date, "stage", `进入「${upgraded.name}」`, upgraded.description, upgraded));
  }
  return {
    adoption: { ...adoption, currentExp: total, currentStageId: toStage.id, growthRecords },
    upgraded,
    fromStage,
    toStage,
  };
}

export function water(adoption: PlantAdoption, plant: Plant, date: string): { adoption: PlantAdoption; firstTime: boolean } {
  if (adoption.growthRecords.some((r) => r.date === date && r.type === "water")) {
    return { adoption, firstTime: false };
  }
  const stage = resolveStage(plant, adoption.currentExp);
  return {
    adoption: {
      ...adoption,
      totalWateringCount: adoption.totalWateringCount + 1,
      growthRecords: [...adoption.growthRecords, record(date, "water", "为植物浇了水", "今天的努力变成了水。", stage)],
    },
    firstTime: true,
  };
}

export const wateredOn = (adoption: PlantAdoption | undefined, date: string) =>
  !!adoption?.growthRecords.some((r) => r.date === date && r.type === "water");
