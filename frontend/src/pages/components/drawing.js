// Drawing actions are plain objects so they can be sent over the WebSocket and replayed on every client:
//   { tool: 'brush' | 'eraser' | 'line' | 'rectangle' | 'circle', from: {x, y}, to: {x, y}, color, size }
//   { tool: 'fill', color }
//   { tool: 'clear' }

export const SHAPE_TOOLS = ['line', 'rectangle', 'circle'];

export const isShapeTool = (tool) => SHAPE_TOOLS.includes(tool);

export function renderAction(ctx, action) {
  const { width, height } = ctx.canvas;
  const { tool, from, to, color, size } = action;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size;
  ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';

  switch (tool) {
    case 'brush':
    case 'eraser':
    case 'line':
      if (tool === 'eraser') ctx.lineWidth = size * 2;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      break;
    case 'rectangle':
      ctx.strokeRect(from.x, from.y, to.x - from.x, to.y - from.y);
      break;
    case 'circle': {
      const radius = Math.hypot(to.x - from.x, to.y - from.y) / 2;
      ctx.beginPath();
      ctx.arc((from.x + to.x) / 2, (from.y + to.y) / 2, radius, 0, 2 * Math.PI);
      ctx.stroke();
      break;
    }
    case 'fill':
      ctx.fillRect(0, 0, width, height);
      break;
    case 'clear':
      ctx.clearRect(0, 0, width, height);
      break;
    default:
      break;
  }

  ctx.restore();
}
