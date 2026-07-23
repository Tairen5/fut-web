import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player.js';

dotenv.config();

const update = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const result = await Player.findOneAndUpdate(
      { name: 'F. Mendy' },
      {
        $set: {
          playStyles: [
            { name: 'Long Ball Pass', image: 'Long Ball Pass.png' },
            { name: 'Long Ball Pass+', image: 'Long Ball Pass+.png' }
          ]
        }
      },
      { returnDocument: 'after' }
    );

    if (result) {
      console.log('✅ Mendy actualizado correctamente:', result.playStyles);
    } else {
      console.log('⚠️ No se encontró ningún jugador con ese nombre.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

update();
