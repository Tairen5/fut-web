import User from '../models/User.js';

export const completeMatch = async (req, res) => {
  try {
    const { result, difficulty, mode } = req.body;
    const userId = req.userId;

    if (!['win', 'draw', 'loss'].includes(result)) {
      return res.status(400).json({ message: 'Resultado inválido.' });
    }
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ message: 'Dificultad inválida.' });
    }
    if (!['rivals', 'friendlies'].includes(mode)) {
      return res.status(400).json({ message: 'Modo de juego inválido.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Calcular recompensa en monedas
    let coinReward = 0;
    if (result === 'win') {
      if (difficulty === 'easy') coinReward = 250;
      else if (difficulty === 'medium') coinReward = 400;
      else if (difficulty === 'hard') coinReward = 600;
    } else if (result === 'draw') {
      if (difficulty === 'easy') coinReward = 150;
      else if (difficulty === 'medium') coinReward = 250;
      else if (difficulty === 'hard') coinReward = 350;
    } else if (result === 'loss') {
      if (difficulty === 'easy') coinReward = 100;
      else if (difficulty === 'medium') coinReward = 150;
      else if (difficulty === 'hard') coinReward = 200;
    }

    // Calcular cambio de ELO (solo para Division Rivals)
    let eloChange = 0;
    if (mode === 'rivals') {
      if (result === 'win') {
        if (difficulty === 'easy') eloChange = 15;
        else if (difficulty === 'medium') eloChange = 25;
        else if (difficulty === 'hard') eloChange = 40;
      } else if (result === 'draw') {
        if (difficulty === 'easy') eloChange = 5;
        else if (difficulty === 'medium') eloChange = 10;
        else if (difficulty === 'hard') eloChange = 15;
      } else if (result === 'loss') {
        if (difficulty === 'easy') eloChange = -10;
        else if (difficulty === 'medium') eloChange = -15;
        else if (difficulty === 'hard') eloChange = -20;
      }
    }

    // Actualizar registro del usuario
    if (result === 'win') {
      user.record.wins += 1;
    } else if (result === 'draw') {
      user.record.draws += 1;
    } else if (result === 'loss') {
      user.record.losses += 1;
    }

    user.currency += coinReward;
    user.elo = Math.max(0, user.elo + eloChange);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Partido completado con éxito.',
      coinReward,
      eloChange,
      updatedUser: {
        _id: user._id,
        username: user.username,
        currency: user.currency,
        points: user.points,
        elo: user.elo,
        record: user.record,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
