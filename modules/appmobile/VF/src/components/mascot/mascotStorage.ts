import AsyncStorage from '@react-native-async-storage/async-storage';
import { MascotSpecies, MascotMotionMode } from './types';

const STORAGE_KEY = '@vif_mascot_species';
const MOTION_MODE_KEY = 'vif_mascot_mode';
const listeners: Array<(species: MascotSpecies) => void> = [];
const modeListeners: Array<(mode: MascotMotionMode) => void> = [];

export const getStoredSpecies = async (): Promise<MascotSpecies> => {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY);
    if (val === 'cat' || val === 'bear') {
      return val;
    }
  } catch (e) {
    console.warn('[mascotStorage] Error reading species:', e);
  }
  return 'bear';
};

export const setStoredSpecies = async (species: MascotSpecies): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, species);
    listeners.forEach((fn) => {
      try {
        fn(species);
      } catch (err) {
        console.warn('[mascotStorage] Listener error:', err);
      }
    });
  } catch (e) {
    console.warn('[mascotStorage] Error saving species:', e);
  }
};

export const subscribeSpeciesChange = (callback: (species: MascotSpecies) => void) => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};

export const getStoredMotionMode = async (): Promise<MascotMotionMode> => {
  try {
    const val = await AsyncStorage.getItem(MOTION_MODE_KEY);
    if (val === 'roaming' || val === 'bouncing' || val === 'static') {
      return val;
    }
  } catch (e) {
    console.warn('[mascotStorage] Error reading motion mode:', e);
  }
  return 'bouncing'; // Mặc định nhún nhảy tại chỗ nhẹ nhàng
};

export const setStoredMotionMode = async (mode: MascotMotionMode): Promise<void> => {
  try {
    await AsyncStorage.setItem(MOTION_MODE_KEY, mode);
    modeListeners.forEach((fn) => {
      try {
        fn(mode);
      } catch (err) {
        console.warn('[mascotStorage] Mode listener error:', err);
      }
    });
  } catch (e) {
    console.warn('[mascotStorage] Error saving motion mode:', e);
  }
};

export const subscribeMotionModeChange = (callback: (mode: MascotMotionMode) => void) => {
  modeListeners.push(callback);
  return () => {
    const index = modeListeners.indexOf(callback);
    if (index !== -1) {
      modeListeners.splice(index, 1);
    }
  };
};

