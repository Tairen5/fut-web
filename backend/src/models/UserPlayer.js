import mongoose from 'mongoose';

const userPlayerSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  isTradeable: { type: Boolean, default: false },
  matchStats: {
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    matchesPlayed: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model('UserPlayer', userPlayerSchema);
