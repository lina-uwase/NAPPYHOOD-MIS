// API Simulator for development purposes
export const apiSimulator = {
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  simulateResponse: <T>(data: T): Promise<T> => {
    return Promise.resolve(data);
  }
};