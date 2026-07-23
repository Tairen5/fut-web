import { FORMATIONS } from './formations';

const FORMATION_TEMPLATE = FORMATIONS['4-3-3'].positions;

const GENE_RANGES = {
  shootChance:          { min: 0.005, max: 0.06 },
  passChance:           { min: 0.01,  max: 0.06 },
  crossChance:          { min: 0.01,  max: 0.06 },
  pressDistance:        { min: 150,   max: 500 },
  ballShiftX:           { min: 0.2,   max: 0.7 },
  ballShiftY:           { min: 0.1,   max: 0.4 },
  attackingBias:        { min: -1,    max: 1 },
  forwardPassBias:      { min: 0,     max: 1 },
  shotDistance:         { min: 800,   max: 1150 },
  dribbleBias:          { min: 0,     max: 1 },
  pressIntensity:       { min: 0.3,   max: 1 },
  counterAttackSpeed:   { min: 0,     max: 1 },
  playThroughCenter:    { min: 0,     max: 1 },
  goalSeekingIntensity: { min: 0,     max: 1 },
  throughBallFrequency: { min: 0,     max: 1 },
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// ─── Crear genoma aleatorio ───
export function createRandomGenome() {
  const formation = FORMATION_TEMPLATE.map((pos) => {
    if (pos.pos === 'GK') return { px: 50, py: 88 };
    return {
      px: clamp(pos.x + (Math.random() - 0.5) * 20, 5, 95),
      py: clamp(pos.y + (Math.random() - 0.5) * 20, 10, 90),
    };
  });

  const tactics = {};
  for (const [key, range] of Object.entries(GENE_RANGES)) {
    tactics[key] = randomBetween(range.min, range.max);
  }

  return { formation, tactics };
}

// ─── Fitness de un individuo ───
export function calculateFitness(matchResult) {
  let pts = 0;
  if (matchResult.result === 'win') pts = 100;
  else if (matchResult.result === 'draw') pts = 40;
  else pts = 10;

  pts += matchResult.goalsFor * 5;
  pts -= matchResult.goalsAgainst * 2;

  return Math.max(0, pts);
}

// ─── Selección por torneo ───
export function tournamentSelect(population, fitnesses, tournamentSize = 3) {
  let bestIdx = -1;
  let bestFit = -Infinity;
  for (let i = 0; i < tournamentSize; i++) {
    const idx = Math.floor(Math.random() * population.length);
    if (fitnesses[idx] > bestFit) {
      bestFit = fitnesses[idx];
      bestIdx = idx;
    }
  }
  return population[bestIdx];
}

// ─── Cruce uniforme ───
export function crossover(parentA, parentB) {
  const child = {
    formation: parentA.formation.map((posA, i) => {
      return Math.random() < 0.5 ? { ...posA } : { ...parentB.formation[i] };
    }),
    tactics: {},
  };

  for (const key of Object.keys(GENE_RANGES)) {
    child.tactics[key] = Math.random() < 0.5
      ? parentA.tactics[key]
      : parentB.tactics[key];
  }

  return child;
}

// ─── Mutación ───
export function mutate(genome, mutationRate = 0.1) {
  const result = {
    formation: genome.formation.map((pos, i) => {
      if (i === 0) return { ...pos };
      const mutated = { ...pos };
      if (Math.random() < mutationRate) {
        mutated.px = clamp(mutated.px + (Math.random() - 0.5) * 15, 5, 95);
        mutated.py = clamp(mutated.py + (Math.random() - 0.5) * 15, 10, 90);
      }
      return mutated;
    }),
    tactics: { ...genome.tactics },
  };

  for (const [key, range] of Object.entries(GENE_RANGES)) {
    if (Math.random() < mutationRate) {
      const rangeSize = (range.max - range.min) * 0.3;
      result.tactics[key] = clamp(
        result.tactics[key] + (Math.random() - 0.5) * rangeSize,
        range.min,
        range.max
      );
    }
  }

  return result;
}

// ─── Crear población inicial ───
export function createPopulation(size = 20) {
  return Array.from({ length: size }, () => createRandomGenome());
}

// ─── Evolucionar una población completa ───
export function evolvePopulation(population, fitnesses) {
  const sorted = [...population]
    .map((g, i) => ({ genome: g, fitness: fitnesses[i] }))
    .sort((a, b) => b.fitness - a.fitness);

  const newPop = [];

  newPop.push({ ...sorted[0].genome });

  while (newPop.length < population.length) {
    const parentA = tournamentSelect(population, fitnesses);
    const parentB = tournamentSelect(population, fitnesses);
    let child = crossover(parentA, parentB);
    child = mutate(child, 0.12);
    newPop.push(child);
  }

  return newPop;
}

// ─── Convertir genoma a datos de jugadores ───
export function genomeToPlayers(genome, team) {
  return FORMATION_TEMPLATE.map((pos, i) => {
    const gene = genome.formation[i];
    const overall = 80;
    return {
      id: `${team}_${pos.index}`,
      name: pos.pos === 'GK' ? 'GK' : pos.pos,
      position: pos.pos,
      index: pos.index,
      team,
      stats: {
        pac: overall + Math.floor((Math.random() - 0.5) * 6),
        sho: overall + Math.floor((Math.random() - 0.5) * 6),
        pas: overall + Math.floor((Math.random() - 0.5) * 6),
        dri: overall + Math.floor((Math.random() - 0.5) * 6),
        def: overall + Math.floor((Math.random() - 0.5) * 6),
        phy: overall + Math.floor((Math.random() - 0.5) * 6),
      },
      overall,
      px: gene.px,
      py: gene.py,
      x: 0,
      y: 0,
      baseX: 0,
      baseY: 0,
    };
  });
}
