import { describe, expect, it, vi } from 'vitest';

import { isShapeTool, renderAction } from './drawing';

function mockContext() {
  return {
    canvas: { width: 200, height: 100 },
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    arc: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
  };
}

const from = { x: 10, y: 20 };
const to = { x: 40, y: 60 };

describe('renderAction', () => {
  it('draws a brush segment with the chosen colour and size', () => {
    const ctx = mockContext();

    renderAction(ctx, { tool: 'brush', from, to, color: '#ff0000', size: 4 });

    expect(ctx.moveTo).toHaveBeenCalledWith(10, 20);
    expect(ctx.lineTo).toHaveBeenCalledWith(40, 60);
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx).toMatchObject({ strokeStyle: '#ff0000', lineWidth: 4, globalCompositeOperation: 'source-over' });
  });

  it('erases with a doubled width', () => {
    const ctx = mockContext();

    renderAction(ctx, { tool: 'eraser', from, to, color: '#000000', size: 5 });

    expect(ctx).toMatchObject({ lineWidth: 10, globalCompositeOperation: 'destination-out' });
  });

  it('draws a rectangle between the two corners', () => {
    const ctx = mockContext();

    renderAction(ctx, { tool: 'rectangle', from, to, color: '#000', size: 2 });

    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 30, 40);
  });

  it('draws a circle inscribed in the dragged box', () => {
    const ctx = mockContext();

    renderAction(ctx, { tool: 'circle', from: { x: 0, y: 0 }, to: { x: 30, y: 40 }, color: '#000', size: 2 });

    expect(ctx.arc).toHaveBeenCalledWith(15, 20, 25, 0, 2 * Math.PI);
  });

  it('fills and clears the whole canvas', () => {
    const ctx = mockContext();

    renderAction(ctx, { tool: 'fill', color: '#00ff00' });
    renderAction(ctx, { tool: 'clear' });

    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 200, 100);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 200, 100);
  });

  it('always restores the context state', () => {
    const ctx = mockContext();

    renderAction(ctx, { tool: 'unknown' });

    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });
});

describe('isShapeTool', () => {
  it('distinguishes shapes from freehand tools', () => {
    expect(['line', 'rectangle', 'circle'].every(isShapeTool)).toBe(true);
    expect(['brush', 'eraser', 'fill', 'clear'].some(isShapeTool)).toBe(false);
  });
});
