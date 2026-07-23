import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player.js';

dotenv.config();

const players = [
  {
    name: 'Mohamed Salah',
    groupKey: 'salah',
    promo: null,
    image: 'Mendy.png',
    overall: 89, position: 'RW', secondaryPositions: ['ST'],
    stats: { pac: 89, sho: 88, pas: 86, dri: 90, def: 45, phy: 76 },
    club: { name: 'Liverpool', image: 'Liverpool.png' },
    nation: { name: 'Egypt', image: 'Egypt.png' },
    playStyles: [
      { name: 'Finesse Shot+', image: 'Finesse Shot+.png' },
      { name: 'Incisive Pass', image: 'Incisive Pass.png' },
      { name: 'Technical', image: 'Technical.png' }
    ]
  },
  {
    name: 'Mohamed Salah',
    groupKey: 'salah',
    promo: 'TOTY',
    image: 'Mendy.png',
    overall: 95, position: 'RW', secondaryPositions: ['ST', 'CAM'],
    stats: { pac: 96, sho: 95, pas: 92, dri: 96, def: 50, phy: 82 },
    club: { name: 'Liverpool', image: 'Liverpool.png' },
    nation: { name: 'Egypt', image: 'Egypt.png' },
    playStyles: [
      { name: 'Finesse Shot+', image: 'Finesse Shot+.png' },
      { name: 'Incisive Pass+', image: 'Incisive Pass+.png' },
      { name: 'Technical+', image: 'Technical+.png' },
      { name: 'Quick Step', image: 'Quick Step.png' }
    ]
  },
  {
    name: 'Erling Haaland',
    groupKey: 'haaland',
    promo: null,
    image: 'Mendy.png',
    overall: 91, position: 'ST', secondaryPositions: [],
    stats: { pac: 89, sho: 93, pas: 70, dri: 80, def: 45, phy: 93 },
    club: { name: 'Manchester City', image: 'ManchesterCity.png' },
    nation: { name: 'Norway', image: 'Norway.png' },
    playStyles: [
      { name: 'Power Shot+', image: 'Power Shot+.png' },
      { name: 'Aerial+', image: 'Aerial+.png' },
      { name: 'Power Header', image: 'Power Header.png' }
    ]
  },
  {
    name: 'Erling Haaland',
    groupKey: 'haaland',
    promo: 'TOTW',
    image: 'Mendy.png',
    overall: 93, position: 'ST', secondaryPositions: [],
    stats: { pac: 90, sho: 95, pas: 72, dri: 82, def: 46, phy: 94 },
    club: { name: 'Manchester City', image: 'ManchesterCity.png' },
    nation: { name: 'Norway', image: 'Norway.png' },
    playStyles: [
      { name: 'Power Shot+', image: 'Power Shot+.png' },
      { name: 'Aerial+', image: 'Aerial+.png' },
      { name: 'Clinical Finisher', image: 'Clinical Finisher.png' }
    ]
  },
  {
    name: 'Kylian Mbappé',
    groupKey: 'mbappe',
    promo: null,
    image: 'Mendy.png',
    overall: 92, position: 'ST', secondaryPositions: ['LW'],
    stats: { pac: 97, sho: 90, pas: 82, dri: 92, def: 36, phy: 78 },
    club: { name: 'Real Madrid', image: 'RealMadrid.png' },
    nation: { name: 'France', image: 'France.png' },
    playStyles: [
      { name: 'Quick Step+', image: 'Quick Step+.png' },
      { name: 'Power Shot', image: 'Power Shot.png' },
      { name: 'Technical', image: 'Technical.png' }
    ]
  },
  {
    name: 'Virgil van Dijk',
    groupKey: 'vdijk',
    promo: null,
    image: 'Mendy.png',
    overall: 90, position: 'CB', secondaryPositions: [],
    stats: { pac: 78, sho: 60, pas: 72, dri: 68, def: 92, phy: 89 },
    club: { name: 'Liverpool', image: 'Liverpool.png' },
    nation: { name: 'Netherlands', image: 'Netherlands.png' },
    playStyles: [
      { name: 'Aerial+', image: 'Aerial+.png' },
      { name: 'Intercept+', image: 'Intercept+.png' },
      { name: 'Block', image: 'Block.png' }
    ]
  },
  {
    name: 'Kevin De Bruyne',
    groupKey: 'debruyne',
    promo: null,
    image: 'Mendy.png',
    overall: 91, position: 'CM', secondaryPositions: ['CAM'],
    stats: { pac: 76, sho: 86, pas: 93, dri: 88, def: 64, phy: 78 },
    club: { name: 'Manchester City', image: 'ManchesterCity.png' },
    nation: { name: 'Belgium', image: 'Belgium.png' },
    playStyles: [
      { name: 'Incisive Pass+', image: 'Incisive Pass+.png' },
      { name: 'Long Ball Pass+', image: 'Long Ball Pass+.png' },
      { name: 'Power Shot', image: 'Power Shot.png' }
    ]
  },
  {
    name: 'Jude Bellingham',
    groupKey: 'bellingham',
    promo: null,
    image: 'Mendy.png',
    overall: 90, position: 'CM', secondaryPositions: ['CAM', 'CF'],
    stats: { pac: 83, sho: 86, pas: 83, dri: 87, def: 72, phy: 84 },
    club: { name: 'Real Madrid', image: 'RealMadrid.png' },
    nation: { name: 'England', image: 'England.png' },
    playStyles: [
      { name: 'Technical+', image: 'Technical+.png' },
      { name: 'Power Shot', image: 'Power Shot.png' },
      { name: 'Relentless', image: 'Relentless.png' }
    ]
  },
  {
    name: 'Bukayo Saka',
    groupKey: 'saka',
    promo: null,
    image: 'Mendy.png',
    overall: 88, position: 'RW', secondaryPositions: ['LW'],
    stats: { pac: 87, sho: 82, pas: 85, dri: 89, def: 48, phy: 68 },
    club: { name: 'Arsenal', image: 'Arsenal.png' },
    nation: { name: 'England', image: 'England.png' },
    playStyles: [
      { name: 'Finesse Shot+', image: 'Finesse Shot+.png' },
      { name: 'Technical', image: 'Technical.png' },
      { name: 'Chip Shot', image: 'Chip Shot.png' }
    ]
  },
  {
    name: 'Vinícius Jr.',
    groupKey: 'vinicius',
    promo: null,
    image: 'Mendy.png',
    overall: 92, position: 'LW', secondaryPositions: ['ST'],
    stats: { pac: 97, sho: 88, pas: 80, dri: 94, def: 30, phy: 72 },
    club: { name: 'Real Madrid', image: 'RealMadrid.png' },
    nation: { name: 'Brazil', image: 'Brazil.png' },
    playStyles: [
      { name: 'Quick Step+', image: 'Quick Step+.png' },
      { name: 'Technical+', image: 'Technical+.png' },
      { name: 'Rapid', image: 'Rapid.png' }
    ]
  },
  {
    name: 'Rodri',
    groupKey: 'rodri',
    promo: 'TOTW',
    image: 'Mendy.png',
    overall: 91, position: 'CDM', secondaryPositions: ['CM'],
    stats: { pac: 72, sho: 80, pas: 86, dri: 84, def: 88, phy: 86 },
    club: { name: 'Manchester City', image: 'ManchesterCity.png' },
    nation: { name: 'Spain', image: 'Spain.png' },
    playStyles: [
      { name: 'Intercept+', image: 'Intercept+.png' },
      { name: 'Long Ball Pass', image: 'Long Ball Pass.png' },
      { name: 'Jockey', image: 'Jockey.png' }
    ]
  },
  {
    name: 'Phil Foden',
    groupKey: 'foden',
    promo: 'TOTW',
    image: 'Mendy.png',
    overall: 89, position: 'CAM', secondaryPositions: ['RW', 'LW'],
    stats: { pac: 84, sho: 84, pas: 86, dri: 91, def: 48, phy: 64 },
    club: { name: 'Manchester City', image: 'ManchesterCity.png' },
    nation: { name: 'England', image: 'England.png' },
    playStyles: [
      { name: 'Technical+', image: 'Technical+.png' },
      { name: 'Finesse Shot', image: 'Finesse Shot.png' },
      { name: 'Chip Shot', image: 'Chip Shot.png' }
    ]
  },
  {
    name: 'Marcus Rashford',
    groupKey: 'rashford',
    promo: 'TOTW',
    image: 'Mendy.png',
    overall: 86, position: 'LW', secondaryPositions: ['ST'],
    stats: { pac: 94, sho: 84, pas: 76, dri: 86, def: 32, phy: 74 },
    club: { name: 'Manchester United', image: 'ManchesterUnited.png' },
    nation: { name: 'England', image: 'England.png' },
    playStyles: [
      { name: 'Quick Step+', image: 'Quick Step+.png' },
      { name: 'Power Shot', image: 'Power Shot.png' },
      { name: 'Explosive', image: 'Explosive.png' }
    ]
  },
  {
    name: 'Lamine Yamal',
    groupKey: 'yamal',
    promo: null,
    image: 'Mendy.png',
    overall: 86, position: 'RW', secondaryPositions: [],
    stats: { pac: 89, sho: 78, pas: 82, dri: 90, def: 30, phy: 60 },
    club: { name: 'FC Barcelona', image: 'Barcelona.png' },
    nation: { name: 'Spain', image: 'Spain.png' },
    playStyles: [
      { name: 'Technical+', image: 'Technical+.png' },
      { name: 'Finesse Shot', image: 'Finesse Shot.png' },
      { name: 'Rapid', image: 'Rapid.png' }
    ]
  },
  {
    name: 'Florian Wirtz',
    groupKey: 'wirtz',
    promo: null,
    image: 'Mendy.png',
    overall: 88, position: 'CAM', secondaryPositions: ['CM'],
    stats: { pac: 82, sho: 84, pas: 88, dri: 90, def: 52, phy: 66 },
    club: { name: 'Bayer Leverkusen', image: 'BayerLeverkusen.png' },
    nation: { name: 'Germany', image: 'Germany.png' },
    playStyles: [
      { name: 'Incisive Pass+', image: 'Incisive Pass+.png' },
      { name: 'Technical', image: 'Technical.png' },
      { name: 'Finesse Shot', image: 'Finesse Shot.png' }
    ]
  },
  {
    name: 'Ousmane Dembélé',
    groupKey: 'dembélé',
    promo: null,
    image: 'Mendy.png',
    overall: 86, position: 'RW', secondaryPositions: ['LW'],
    stats: { pac: 93, sho: 76, pas: 80, dri: 90, def: 32, phy: 62 },
    club: { name: 'Paris Saint-Germain', image: 'PSG.png' },
    nation: { name: 'France', image: 'France.png' },
    playStyles: [
      { name: 'Quick Step+', image: 'Quick Step+.png' },
      { name: 'Chip Shot', image: 'Chip Shot.png' },
      { name: 'Rapid', image: 'Rapid.png' }
    ]
  },
  {
    name: 'Federico Valverde',
    groupKey: 'valverde',
    promo: null,
    image: 'Mendy.png',
    overall: 89, position: 'CM', secondaryPositions: ['RM', 'RB'],
    stats: { pac: 90, sho: 84, pas: 84, dri: 84, def: 78, phy: 84 },
    club: { name: 'Real Madrid', image: 'RealMadrid.png' },
    nation: { name: 'Uruguay', image: 'Uruguay.png' },
    playStyles: [
      { name: 'Relentless+', image: 'Relentless+.png' },
      { name: 'Power Shot', image: 'Power Shot.png' },
      { name: 'Long Ball Pass', image: 'Long Ball Pass.png' }
    ]
  },
  {
    name: 'Martin Ødegaard',
    groupKey: 'odegaard',
    promo: null,
    image: 'Mendy.png',
    overall: 89, position: 'CAM', secondaryPositions: ['CM'],
    stats: { pac: 78, sho: 84, pas: 92, dri: 90, def: 52, phy: 64 },
    club: { name: 'Arsenal', image: 'Arsenal.png' },
    nation: { name: 'Norway', image: 'Norway.png' },
    playStyles: [
      { name: 'Incisive Pass+', image: 'Incisive Pass+.png' },
      { name: 'Dead Ball', image: 'Dead Ball.png' },
      { name: 'Technical', image: 'Technical.png' }
    ]
  },
  {
    name: 'Declan Rice',
    groupKey: 'rice',
    promo: null,
    image: 'Mendy.png',
    overall: 87, position: 'CDM', secondaryPositions: ['CB'],
    stats: { pac: 76, sho: 72, pas: 80, dri: 78, def: 88, phy: 86 },
    club: { name: 'Arsenal', image: 'Arsenal.png' },
    nation: { name: 'England', image: 'England.png' },
    playStyles: [
      { name: 'Intercept+', image: 'Intercept+.png' },
      { name: 'Jockey', image: 'Jockey.png' },
      { name: 'Block', image: 'Block.png' }
    ]
  },
  {
    name: 'Lautaro Martínez',
    groupKey: 'lautaro',
    promo: 'TOTW',
    image: 'Mendy.png',
    overall: 89, position: 'ST', secondaryPositions: [],
    stats: { pac: 86, sho: 90, pas: 78, dri: 86, def: 42, phy: 80 },
    club: { name: 'Inter Milan', image: 'InterMilan.png' },
    nation: { name: 'Argentina', image: 'Argentina.png' },
    playStyles: [
      { name: 'Clinical Finisher+', image: 'Clinical Finisher+.png' },
      { name: 'Power Shot', image: 'Power Shot.png' },
      { name: 'Power Header', image: 'Power Header.png' }
    ]
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    await Player.deleteMany({});
    console.log('Player collection cleared');

    await Player.insertMany(players);
    console.log(`${players.length} players inserted successfully`);

    process.exit(0);
  } catch (error) {
    console.error('Error in seed:', error.message);
    process.exit(1);
  }
};

seed();
