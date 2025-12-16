import { useState } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { MultiViewCanvas } from './components/Canvas/MultiViewCanvas';
import { MobileToolbar } from './components/Toolbar/MobileToolbar';
import { SpecificationPanel } from './components/Specification/SpecificationPanel';
import { PropertiesPanel } from './components/Sidebar/PropertiesPanel';
import { isMobileDevice } from './utils/helpers';

function App() {
  const isMobile = isMobileDevice();
  const [showSpecModal, setShowSpecModal] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background)] overflow-hidden">
      {/* Header */}
      <Header onOpenSpecs={() => setShowSpecModal(true)} />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Components & Labels */}
        {!isMobile && (
          <aside className="w-56 border-r border-[var(--color-border)] bg-[var(--color-surface)] overflow-y-auto">
            <Sidebar />
          </aside>
        )}
        
        {/* Canvas Area */}
        <main className="flex-1 overflow-hidden">
          <MultiViewCanvas />
        </main>
        
        {/* Right Sidebar - Properties Panel (always visible on desktop) */}
        {!isMobile && (
          <aside className="w-64 border-l border-[var(--color-border)] bg-[var(--color-surface)] overflow-y-auto">
            <PropertiesPanel />
          </aside>
        )}
      </div>
      
      {/* Mobile Bottom Toolbar */}
      {isMobile && <MobileToolbar />}

      {/* Specification Modal */}
      {showSpecModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <SpecificationPanel onClose={() => setShowSpecModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
