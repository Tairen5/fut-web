import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fut-web';

async function run() {
  await mongoose.connect(MONGO_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  // Añade isAdmin: false a todos los que no lo tengan
  await User.updateMany({ isAdmin: { $exists: false } }, { $set: { isAdmin: false } });

  // Pon tu usuario como admin (cambia el discordUsername por el tuyo)
  const result = await User.findOneAndUpdate(
    { discordUsername: 'TU_USERNAME_DISCORD' },
    { $set: { isAdmin: true } },
    { new: true }
  );

  console.log(result ? `Admin asignado a: ${result.discordUsername}` : 'Usuario no encontrado');
  await mongoose.disconnect();
}

run();
