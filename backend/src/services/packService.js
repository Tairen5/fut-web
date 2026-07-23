import Pack from '../models/Pack.js';
import Player from '../models/Player.js';
import User from '../models/User.js';
import UserPlayer from '../models/UserPlayer.js';

export const getAllPacks = async () => {
  return Pack.find().populate('possibleCards.player_id');
};

export const openPack = async (userId, packId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');

  const pack = await Pack.findById(packId).populate('possibleCards.player_id');
  if (!pack) throw new Error('Pack not found.');

  if (user.currency < pack.price) throw new Error('Not enough coins.');

  user.currency -= pack.price;
  await user.save();

  const totalWeight = pack.possibleCards.reduce((sum, c) => sum + c.weight, 0);
  const pulled = [];

  for (let i = 0; i < pack.numCards; i++) {
    let rand = Math.random() * totalWeight;
    let chosen = pack.possibleCards[0];
    for (const card of pack.possibleCards) {
      rand -= card.weight;
      if (rand <= 0) {
        chosen = card;
        break;
      }
    }
    pulled.push(chosen.player_id);
  }

  const userPlayers = [];
  for (const player of pulled) {
    const up = await UserPlayer.create({
      user_id: userId,
      player_id: player._id,
      isTradeable: true
    });
    userPlayers.push(up);
  }

  return { cards: pulled, userPlayers, currency: user.currency };
};

export const claimPack = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');

  const players = await Player.find();
  if (players.length === 0) throw new Error('No players available.');

  const pulled = [];
  for (let i = 0; i < 5; i++) {
    const randIndex = Math.floor(Math.random() * players.length);
    pulled.push(players[randIndex]);
  }

  const userPlayers = [];
  for (const player of pulled) {
    const up = await UserPlayer.create({
      user_id: userId,
      player_id: player._id,
      isTradeable: true
    });
    userPlayers.push(up);
  }

  return { cards: pulled, userPlayers, currency: user.currency };
};
