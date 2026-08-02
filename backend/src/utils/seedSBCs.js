import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SBC from '../models/SBC.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    await SBC.deleteMany({});
    console.log('SBCs collection cleared');

    const now = new Date();

    const sbcs = [
      {
        name: 'Ousmane Dembélé',
        description: 'Earn a special UEFA Dreamchasers Ousmane Dembélé.',
        image: 'https://cdn.futbin.com/player_images/large/231747.png',
        rewardDescription: 'x1 UCL Dreamchasers Dembélé (Untradeable)',
        rewardCardImage: 'https://cdn.futbin.com/player_images/large/231747.png',
        repeatable: false,
        expiresAt: new Date(now.getTime() + 15 * 60 * 60 * 1000),
        isActive: true,
        challenges: [
          {
            name: 'Ligue 1',
            description: 'Submit a squad with 11 Ligue 1 players.',
            requirements: { minOverall: 80, minLeagues: 1, minClubs: 1, minNations: 1, positionFilters: [] },
            rewards: { type: 'coins', value: 5000, description: '5,000 Coins' },
          },
          {
            name: 'France',
            description: 'Submit a squad with 11 French players.',
            requirements: { minOverall: 82, minLeagues: 1, minClubs: 1, minNations: 11, positionFilters: [] },
            rewards: { type: 'coins', value: 5000, description: '5,000 Coins' },
          },
          {
            name: 'Top Form',
            description: 'Submit a squad with minimum 83 overall.',
            requirements: { minOverall: 83, minLeagues: 2, minClubs: 2, minNations: 2, positionFilters: [] },
            rewards: { type: 'pack', value: 1, description: 'Rare Gold Pack' },
          },
          {
            name: '86-Rated Squad',
            description: 'Submit an 86 rated squad.',
            requirements: { minOverall: 86, minLeagues: 3, minClubs: 3, minNations: 3, positionFilters: [] },
            rewards: { type: 'coins', value: 10000, description: '10,000 Coins' },
          },
        ],
      },
      {
        name: 'James Maddison',
        description: 'Earn a special FUT Birthday James Maddison.',
        image: 'https://cdn.futbin.com/player_images/large/207685.png',
        rewardDescription: 'x1 FUT Birthday Maddison (Untradeable)',
        rewardCardImage: 'https://cdn.futbin.com/player_images/large/207685.png',
        repeatable: false,
        expiresAt: new Date(now.getTime() + 39 * 60 * 60 * 1000),
        isActive: true,
        challenges: [
          {
            name: 'Premier League',
            description: 'Submit a squad with 11 Premier League players.',
            requirements: { minOverall: 80, minLeagues: 1, minClubs: 1, minNations: 1, positionFilters: [] },
            rewards: { type: 'coins', value: 5000, description: '5,000 Coins' },
          },
          {
            name: 'England',
            description: 'Submit a squad with 11 English players.',
            requirements: { minOverall: 82, minLeagues: 2, minClubs: 2, minNations: 11, positionFilters: [] },
            rewards: { type: 'coins', value: 5000, description: '5,000 Coins' },
          },
          {
            name: '85-Rated Squad',
            description: 'Submit an 85 rated squad.',
            requirements: { minOverall: 85, minLeagues: 3, minClubs: 3, minNations: 3, positionFilters: [] },
            rewards: { type: 'pack', value: 1, description: 'Mega Pack' },
          },
        ],
      },
      {
        name: 'FC Pro Leagues - eLALIGA',
        description: 'Earn 2 of 4 FC Pro Leagues Player Items, between Azpilicueta, Gayà, Buchanan and Becker.',
        image: 'https://cdn.futbin.com/player_images/large/189352.png',
        rewardDescription: 'Player Picks (2 of 4)',
        rewardCardImage: 'https://cdn.futbin.com/player_images/large/189352.png',
        repeatable: false,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        challenges: [
          {
            name: 'LaLiga',
            description: 'Submit a squad with 11 LaLiga players.',
            requirements: { minOverall: 80, minLeagues: 1, minClubs: 1, minNations: 1, positionFilters: [] },
            rewards: { type: 'coins', value: 5000, description: '5,000 Coins' },
          },
          {
            name: 'Spain',
            description: 'Submit a squad with 11 Spanish players.',
            requirements: { minOverall: 82, minLeagues: 2, minClubs: 2, minNations: 11, positionFilters: [] },
            rewards: { type: 'coins', value: 5000, description: '5,000 Coins' },
          },
          {
            name: '84-Rated Squad',
            description: 'Submit an 84 rated squad.',
            requirements: { minOverall: 84, minLeagues: 3, minClubs: 3, minNations: 3, positionFilters: [] },
            rewards: { type: 'pack', value: 1, description: 'Jumbo Premium Gold Pack' },
          },
        ],
      },
      {
        name: 'FC Pro Leagues - KPN eDivisie',
        description: 'Earn 2 of 4 FC Pro Leagues Player Items, between Haller, Limbombe, Indi and Van Den Boomen.',
        image: 'https://cdn.futbin.com/player_images/large/208618.png',
        rewardDescription: 'Player Picks (2 of 4)',
        rewardCardImage: 'https://cdn.futbin.com/player_images/large/208618.png',
        repeatable: false,
        expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        isActive: true,
        challenges: [
          {
            name: 'Eredivisie',
            description: 'Submit a squad with 11 Eredivisie players.',
            requirements: { minOverall: 78, minLeagues: 1, minClubs: 1, minNations: 1, positionFilters: [] },
            rewards: { type: 'coins', value: 4000, description: '4,000 Coins' },
          },
          {
            name: 'Netherlands',
            description: 'Submit a squad with 11 Dutch players.',
            requirements: { minOverall: 80, minLeagues: 2, minClubs: 2, minNations: 11, positionFilters: [] },
            rewards: { type: 'coins', value: 4000, description: '4,000 Coins' },
          },
          {
            name: '83-Rated Squad',
            description: 'Submit an 83 rated squad.',
            requirements: { minOverall: 83, minLeagues: 3, minClubs: 3, minNations: 3, positionFilters: [] },
            rewards: { type: 'pack', value: 1, description: 'Premium Gold Players Pack' },
          },
        ],
      },
      {
        name: 'Daily Login Upgrade',
        description: 'Complete daily login challenges to earn rewards.',
        image: 'https://cdn.futbin.com/player_images/large/231747.png',
        rewardDescription: 'x1 Small Prime Gold Players Pack',
        rewardCardImage: '',
        repeatable: true,
        expiresAt: new Date(now.getTime() + 23 * 60 * 60 * 1000),
        isActive: true,
        challenges: [
          {
            name: 'Login Squad',
            description: 'Submit a squad with 5 players.',
            requirements: { minOverall: 70, minLeagues: 1, minClubs: 1, minNations: 1, positionFilters: [] },
            rewards: { type: 'pack', value: 1, description: 'Small Prime Gold Players Pack' },
          },
        ],
      },
      {
        name: 'Hybrid Leagues',
        description: 'Build a squad with players from different leagues.',
        image: 'https://cdn.futbin.com/player_images/large/207685.png',
        rewardDescription: 'x1 Prime Gold Players Pack',
        rewardCardImage: 'https://cdn.futbin.com/player_images/large/207685.png',
        repeatable: false,
        expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        isActive: true,
        challenges: [
          {
            name: '5 Leagues',
            description: 'Submit a squad with players from at least 5 different leagues.',
            requirements: { minOverall: 82, minLeagues: 5, minClubs: 5, minNations: 5, positionFilters: [] },
            rewards: { type: 'pack', value: 1, description: 'Prime Gold Players Pack' },
          },
        ],
      },
    ];

    await SBC.insertMany(sbcs);
    console.log(`${sbcs.length} SBCs inserted successfully`);

    process.exit(0);
  } catch (error) {
    console.error('Error in SBC seed:', error.message);
    process.exit(1);
  }
};

seed();
