import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Sidebar from './app/components/Sidebar/Sidebar';
import { useAudioSync } from './app/hooks/useAudioSync';
import './styles/index.css';

const WebStandaloneApp = () => {
  useAudioSync();
  return (
    <div className="min-h-screen bg-[#0e0f14] flex items-center justify-center p-4">
      <div className="w-[400px] h-[720px] bg-melo-dark border border-melo-border rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(224,100,93,0.15)] flex flex-col">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <WebStandaloneApp />
    </Provider>
  </StrictMode>,
);
