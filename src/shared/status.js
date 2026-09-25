export const statusText = (...parts) => parts.filter(part => part !== undefined && part !== null && part !== '').join(' | ');
