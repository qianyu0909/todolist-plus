import AsyncStorage from '@react-native-async-storage/async-storage';

export const setStorage = async (key: string, value: string) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    // storage fail
  }
};

export const getStorage = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      //Data exists, and appropriate processing will be carried out.
      return value
    } else {
      return '[]'
    }
  } catch (e) {
    return '[]'
  }
};
