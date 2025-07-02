// Import React
// • Rol: Necesită biblioteca React pentru JSX și crearea componentelor.
import React from 'react';

// Definiție unelte de joc
// • Rol: Listă de obiecte care descriu uneltele disponibile pentru desen.
// • Structură: Fiecare obiect conține id, label, description și elementul icon.
const tools = [
  {
    // Instrument: Brush
    // • Rol: Pensulă pentru desen liber (freehand).
    id: 'brush',
    label: 'Brush',
    description: 'Freehand painting tool',
    icon: <i className="fas fa-paint-brush fa-lg" aria-hidden="true" />
  },
  {
    // Instrument: Eraser
    // • Rol: Șterge părți din desen (radieră).
    id: 'eraser',
    label: 'Eraser',
    description: 'Erase parts of the drawing',
    icon: <i className="fas fa-eraser fa-lg" aria-hidden="true" />
  },
  {
    // Instrument: Line
    // • Rol: Desenează linii drepte.
    id: 'line',
    label: 'Line',
    description: 'Draw straight lines',
    icon: <i className="fas fa-minus fa-lg" aria-hidden="true" />
  },
  {
    // Instrument: Rectangle
    // • Rol: Desenează dreptunghiuri.
    id: 'rectangle',
    label: 'Rectangle',
    description: 'Draw rectangles',
    icon: <i className="fas fa-square fa-lg" aria-hidden="true" />
  },
  {
    // Instrument: Circle
    // • Rol: Desenează cercuri sau elipse.
    id: 'circle',
    label: 'Circle',
    description: 'Draw circles or ellipses',
    icon: <i className="fas fa-circle fa-lg" aria-hidden="true" />
  },
  {
    // Instrument: Fill
    // • Rol: Umple o zonă închisă cu culoarea selectată.
    id: 'fill',
    label: 'Fill',
    description: 'Fill a closed area with color',
    icon: <i className="fas fa-fill-drip fa-lg" aria-hidden="true" />
  },
  {
    // Instrument: Clear
    // • Rol: Curăță întregul canvas.
    id: 'clear',
    label: 'Clear',
    description: 'Clear the entire canvas',
    icon: <i className="fas fa-trash fa-lg" aria-hidden="true" />
  },
];

// Export unelte
// • Rol: Expune lista de unelte pentru a fi importată și utilizată în componentele GameRoom.
export default tools;