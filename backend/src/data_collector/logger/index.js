// Simple structured logger for the data collector
export const logger = {
  info: (msg, meta = {}) => {
    console.log(JSON.stringify({ level: 'info', msg, timestamp: new Date().toISOString(), ...meta }));
  },
  warn: (msg, meta = {}) => {
    console.warn(JSON.stringify({ level: 'warn', msg, timestamp: new Date().toISOString(), ...meta }));
  },
  error: (msg, error, meta = {}) => {
    console.error(JSON.stringify({ 
      level: 'error', 
      msg, 
      error: error?.message || error, 
      stack: error?.stack,
      timestamp: new Date().toISOString(), 
      ...meta 
    }));
  }
};
