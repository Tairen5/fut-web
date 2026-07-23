import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Pack from '../models/Pack.js';
import Player from '../models/Player.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    await Pack.deleteMany({});
    console.log('Packs collection cleared');

    const players = await Player.find();
    if (players.length === 0) {
      console.error('No players found. Run seedPlayers first.');
      process.exit(1);
    }

    const getWeight = (overall) => {
      if (overall >= 90) return 1;
      if (overall >= 85) return 3;
      if (overall >= 80) return 6;
      if (overall >= 75) return 10;
      return 15;
    };

    const allCards = players.map(p => ({
      player_id: p._id,
      weight: getWeight(p.overall)
    }));

    const packs = [
      {
        name: 'Bronze Pack',
        price: 500,
        numCards: 3,
        image: 'bronze',
        possibleCards: allCards.filter(c => {
          const p = players.find(pl => pl._id.toString() === c.player_id.toString());
          return p && p.overall < 75;
        }).length > 0
          ? allCards.filter(c => {
              const p = players.find(pl => pl._id.toString() === c.player_id.toString());
              return p && p.overall < 75;
            })
          : allCards
      },
      {
        name: 'Silver Pack',
        price: 2000,
        numCards: 4,
        image: 'silver',
        possibleCards: allCards.filter(c => {
          const p = players.find(pl => pl._id.toString() === c.player_id.toString());
          return p && p.overall >= 75 && p.overall < 85;
        }).length > 0
          ? allCards.filter(c => {
              const p = players.find(pl => pl._id.toString() === c.player_id.toString());
              return p && p.overall >= 75 && p.overall < 85;
            })
          : allCards
      },
      {
        name: 'Gold Pack',
        price: 5000,
        numCards: 5,
        image: 'gold',
        possibleCards: allCards.filter(c => {
          const p = players.find(pl => pl._id.toString() === c.player_id.toString());
          return p && p.overall >= 80;
        }).length > 0
          ? allCards.filter(c => {
              const p = players.find(pl => pl._id.toString() === c.player_id.toString());
              return p && p.overall >= 80;
            })
          : allCards
      },
      {
        name: 'Premium Gold Pack',
        price: 10000,
        numCards: 5,
        image: 'premium',
        possibleCards: allCards.filter(c => {
          const p = players.find(pl => pl._id.toString() === c.player_id.toString());
          return p && p.overall >= 85;
        }).length > 0
          ? allCards.filter(c => {
              const p = players.find(pl => pl._id.toString() === c.player_id.toString());
              return p && p.overall >= 85;
            })
          : allCards
      }
    ];

    await Pack.insertMany(packs);
    console.log(`${packs.length} packs inserted successfully`);

    process.exit(0);
  } catch (error) {
    console.error('Error in pack seed:', error.message);
    process.exit(1);
  }
};

seed();
