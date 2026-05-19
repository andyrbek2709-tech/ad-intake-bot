/**
 * Structured logging utility
 * All logs are JSON for easy parsing in production
 */

export const logger = {
  error: (msg, context = {}) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      msg,
      ...context,
      ts: new Date().toISOString()
    }));
  },

  warn: (msg, context = {}) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      msg,
      ...context,
      ts: new Date().toISOString()
    }));
  },

  info: (msg, context = {}) => {
    console.log(JSON.stringify({
      level: 'INFO',
      msg,
      ...context,
      ts: new Date().toISOString()
    }));
  },

  debug: (msg, context = {}) => {
    if (process.env.DEBUG) {
      console.log(JSON.stringify({
        level: 'DEBUG',
        msg,
        ...context,
        ts: new Date().toISOString()
      }));
    }
  }
};
