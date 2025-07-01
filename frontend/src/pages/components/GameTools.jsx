import React from 'react';
const tools = [
  {
    id: 'brush',
    label: 'Brush',
    description: 'Freehand painting tool',
    icon: <i className="fas fa-paint-brush fa-lg" aria-hidden="true" />
  },
  {
    id: 'eraser',
    label: 'Eraser',
    description: 'Erase parts of the drawing',
    icon: <i className="fas fa-eraser fa-lg" aria-hidden="true" />
  },
  {
    id: 'line',
    label: 'Line',
    description: 'Draw straight lines',
    icon: <i className="fas fa-minus fa-lg" aria-hidden="true" />
  },
  {
    id: 'rectangle',
    label: 'Rectangle',
    description: 'Draw rectangles',
    icon: <i className="fas fa-square fa-lg" aria-hidden="true" />
  },
  {
    id: 'circle',
    label: 'Circle',
    description: 'Draw circles or ellipses',
    icon: <i className="fas fa-circle fa-lg" aria-hidden="true" />
  },
  {
    id: 'fill',
    label: 'Fill',
    description: 'Fill a closed area with color',
    icon: <i className="fas fa-fill-drip fa-lg" aria-hidden="true" />
  },
  {
    id: 'clear',
    label: 'Clear',
    description: 'Clear the entire canvas',
    icon: <i className="fas fa-trash fa-lg" aria-hidden="true" />
  },
];

export default tools;