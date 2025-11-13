import React from 'react';
import D3Graph from './components/D3Graph';
import { sampleGraphData } from './data/sampleData';
import './App.css';

function App() {
  return (
    <div className="App">
      <main className="App-main">
        <D3Graph 
          data={sampleGraphData} 
          width="100%"
          height={1080}
        />
      </main>
    </div>
  );
}

export default App;
