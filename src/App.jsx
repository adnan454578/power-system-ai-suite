import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ChatContainer from './components/ChatBot/ChatContainer';
import CostEngineHub from './components/CostEngine/CostEngineHub';
import LiveGridDashboard from './components/Telemetry/LiveGridDashboard';
import LoadForecastStudio from './components/Forecasting/LoadForecastStudio';
import PlantParametersStudio from './components/PlantParameters/PlantParametersStudio';
import { PowerGridSimulator } from './services/gridSimulator';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'parameters' | 'cost' | 'telemetry' | 'forecasting'
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  
  // Simulator instance ref
  const simulatorRef = useRef(new PowerGridSimulator({ nominalFrequency: 50.00, baseDemandMw: 14500 }));
  const [gridSnapshot, setGridSnapshot] = useState(simulatorRef.current.getSnapshot());

  // Simulation tick loop (1 second interval)
  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      const snap = simulatorRef.current.step(1.0);
      setGridSnapshot({ ...snap });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulationRunning]);

  // Trigger grid event (from Chatbot or Telemetry Dashboard)
  const handleTriggerGridEvent = (eventType, params) => {
    simulatorRef.current.triggerEvent(eventType, params);
    setGridSnapshot({ ...simulatorRef.current.getSnapshot() });
  };

  // Reset grid simulation to nominal
  const handleResetSimulation = () => {
    simulatorRef.current = new PowerGridSimulator({ nominalFrequency: 50.00, baseDemandMw: 14500 });
    setGridSnapshot({ ...simulatorRef.current.getSnapshot() });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gridSnapshot={gridSnapshot}
        isSimulationRunning={isSimulationRunning}
        setIsSimulationRunning={setIsSimulationRunning}
        onResetSimulation={handleResetSimulation}
      />

      {/* Main Content Area Based on Active Tab */}
      <main style={{ flex: 1, paddingBottom: '30px' }}>
        {activeTab === 'chat' && (
          <ChatContainer
            gridSnapshot={gridSnapshot}
            onTriggerGridEvent={handleTriggerGridEvent}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'parameters' && (
          <PlantParametersStudio
            gridSnapshot={gridSnapshot}
          />
        )}

        {activeTab === 'cost' && (
          <CostEngineHub />
        )}

        {activeTab === 'telemetry' && (
          <LiveGridDashboard
            gridSnapshot={gridSnapshot}
            onTriggerGridEvent={handleTriggerGridEvent}
            onResetSimulation={handleResetSimulation}
          />
        )}

        {activeTab === 'forecasting' && (
          <LoadForecastStudio />
        )}
      </main>
    </div>
  );
}
