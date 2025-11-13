# D3.js React Graph Visualization with Dagre

A modern React TypeScript application featuring an interactive graph visualization built with D3.js and Dagre layout algorithm. The graph supports zoom, pan, and drag interactions with hierarchical positioning for an engaging user experience.

## Features

- **Hierarchical Graph Layout**: Uses Dagre algorithm for structured, directed graph layouts
- **Multiple Layout Directions**: Switch between Top-to-Bottom, Left-to-Right, Bottom-to-Top, and Right-to-Left layouts
- **Interactive Visualization**: Built with D3.js for smooth animations and interactions
- **Zoom & Pan**: Mouse wheel zoom and click-drag panning with transform feedback
- **Node Dragging**: Drag individual nodes to reposition them with connected edge updates
- **Organizational Chart**: Sample data represents a company hierarchy structure
- **Responsive Design**: Modern UI with gradient backgrounds and clean styling
- **TypeScript Support**: Full type safety and IntelliSense support

## Technologies Used

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **D3.js v7** - Data-driven visualization library
- **Dagre** - Hierarchical graph layout algorithm
- **CSS3** - Modern styling with gradients and animations

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd d3-react-graph
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### Graph Interactions

- **Zoom**: Use mouse wheel or trackpad to zoom in/out
- **Pan**: Click and drag on empty space to pan around the graph
- **Drag Nodes**: Click and drag individual nodes to reposition them
- **Reset View**: Click the "Reset Zoom" button to return to the original view
- **Layout Direction**: Use the dropdown to switch between different hierarchical layouts:
  - **Top → Bottom**: Traditional organizational chart layout
  - **Left → Right**: Horizontal flow layout
  - **Bottom → Top**: Inverted hierarchy
  - **Right → Left**: Right-to-left flow layout

### Customization

#### Adding New Data

Edit `src/data/sampleData.ts` to modify the graph structure:

```typescript
export const sampleGraphData: GraphData = {
  nodes: [
    { id: "1", name: "Node 1", group: 1 },
    // Add more nodes...
  ],
  links: [
    { source: "1", target: "2", value: 1 },
    // Add more links...
  ]
};
```

#### Styling

- **Graph styles**: Modify `src/App.css` for overall application styling
- **D3 styles**: Update the D3Graph component for visualization-specific styling

## Project Structure

```
src/
├── components/
│   └── D3Graph.tsx          # Main D3 graph component
├── data/
│   └── sampleData.ts        # Sample graph data
├── types/
│   └── graph.ts             # TypeScript interfaces
├── App.tsx                  # Main application component
├── App.css                  # Application styles
├── index.tsx                # React entry point
└── index.css                # Global styles
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Graph Features Explained

### Dagre Layout Algorithm

The graph uses Dagre for hierarchical layout with the following features:

- **Directed Graph Layout**: Automatically positions nodes in a hierarchical structure
- **Configurable Direction**: Supports Top-to-Bottom, Left-to-Right, Bottom-to-Top, and Right-to-Left layouts
- **Node Separation**: Configurable horizontal and vertical spacing between nodes
- **Rank Separation**: Configurable spacing between hierarchy levels
- **Edge Routing**: Automatic edge routing to minimize crossings

### Zoom and Pan

Implemented using D3's zoom behavior:
- Scale extent: 0.1x to 10x zoom
- Smooth transitions with `d3.transition()`
- Transform state tracking for UI feedback

### Node Groups

Nodes are colored by group using D3's categorical color scheme. Modify the `group` property in your data to change node colors.

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Troubleshooting

### Common Issues

1. **Dependencies not installing**: Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
2. **TypeScript errors**: Ensure all dependencies are installed and TypeScript is configured correctly
3. **Graph not rendering**: Check browser console for errors and ensure D3.js is loaded properly

### Performance Tips

- For large graphs (>100 nodes), consider implementing virtualization
- Adjust force simulation parameters for better performance
- Use `simulation.stop()` when component unmounts to prevent memory leaks

## Future Enhancements

- [ ] Node search and filtering
- [ ] Graph export functionality
- [ ] Custom node shapes and sizes
- [ ] Animated transitions
- [ ] Graph clustering algorithms
- [ ] Real-time data updates
