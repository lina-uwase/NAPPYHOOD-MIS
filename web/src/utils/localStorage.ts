export const saveToLocalStorage = <T = unknown>(key: string, data: T) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T = unknown>(key: string, defaultValue: T | null = null): T | null => {
  try {
    if (typeof window !== 'undefined') {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    }
    return defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key: string) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

export const clearAllData = () => {
  try {
    if (typeof window !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('All data cleared from localStorage');
    }
  } catch (error) {
    console.error('Error clearing all data from localStorage:', error);
  }
};

export const clearDataOnly = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SERVICES);
      localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      localStorage.removeItem(STORAGE_KEYS.VISITS);
      console.log('All data cleared from localStorage (keeping user preferences)');
    }
  } catch (error) {
    console.error('Error clearing data from localStorage:', error);
  }
};

export const STORAGE_KEYS = {
  SERVICES: 'nappyhood_services',
  CUSTOMERS: 'nappyhood_customers',
  VISITS: 'nappyhood_visits',
  STAFF: 'nappyhood_staff',
  DARK_MODE: 'darkMode',
  USER_PREFERENCES: 'user_preferences'
} as const;
