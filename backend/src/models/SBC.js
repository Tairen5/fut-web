import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  requirements: {
    minOverall: { type: Number, default: 0 },
    minLeagues: { type: Number, default: 0 },
    minClubs: { type: Number, default: 0 },
    minNations: { type: Number, default: 0 },
    positionFilters: [{
      position: String,
      count: Number,
    }],
    specificPlayers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
    }],
  },
  rewards: {
    type: { type: String, enum: ['coins', 'pack', 'player'], default: 'coins' },
    value: { type: Number, default: 0 },
    description: { type: String, default: '' },
  },
}, { _id: true });

const sbcSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  rewardDescription: { type: String, default: '' },
  rewardCardImage: { type: String, default: '' },
  repeatable: { type: Boolean, default: false },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  challenges: [challengeSchema],
}, { timestamps: true });

export default mongoose.model('SBC', sbcSchema);
