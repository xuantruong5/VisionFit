import { MascotSpecies, MascotStage } from './types';

export const getMascotImage = (
  species: MascotSpecies = 'bear',
  stage: MascotStage = 'starter',
  isWorkoutActive: boolean = false
) => {
  if (species === 'cat') {
    if (isWorkoutActive) {
      return require('../../assets/mascot/cat_active.png');
    }
    switch (stage) {
      case 'champion':
        return require('../../assets/mascot/cat_champion.png');
      case 'strong':
        return require('../../assets/mascot/cat_strong.png');
      case 'active':
        return require('../../assets/mascot/cat_active.png');
      case 'starter':
      default:
        return require('../../assets/mascot/cat_starter.png');
    }
  }

  // Default: bear
  if (isWorkoutActive) {
    return require('../../assets/mascot/bear_active.png');
  }
  switch (stage) {
    case 'champion':
      return require('../../assets/mascot/bear_champion.png');
    case 'strong':
      return require('../../assets/mascot/bear_strong.png');
    case 'active':
      return require('../../assets/mascot/bear_active.png');
    case 'starter':
    default:
      return require('../../assets/mascot/bear_starter.png');
  }
};

