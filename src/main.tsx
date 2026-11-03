import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AiApp } from './ai/AiApp';
import { IdeasPage } from './ai/IdeasPage';
import { ExpressApp } from './express/ExpressApp';
import { HomeApp } from './home/HomeApp';
import './styles/app.css';
import './styles/ai.css';
import './styles/home.css';

// `?journey=express` is the shorter journey, `?journey=ai` the AI-first one, `?view=ai-ideas` the ideas
// behind it and `?view=home` the app's home screen with the AI assistant; anything else is the full Figma journey.
const params = new URLSearchParams(window.location.search);
const journey = params.get('journey');
const view = params.get('view');
const page =
  view === 'ai-ideas' ? (
    <IdeasPage />
  ) : view === 'home' ? (
    <HomeApp />
  ) : journey === 'ai' ? (
    <AiApp />
  ) : journey === 'express' ? (
    <ExpressApp />
  ) : (
    <App />
  );

createRoot(document.getElementById('root')!).render(<StrictMode>{page}</StrictMode>);
