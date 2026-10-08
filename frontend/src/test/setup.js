import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom has no canvas implementation; components only need the calls to succeed.
const canvasContext = new Proxy({}, { get: (target, prop) => (target[prop] ??= vi.fn()) });
HTMLCanvasElement.prototype.getContext = () => canvasContext;

afterEach(() => {
  cleanup();
  localStorage.clear();
});
