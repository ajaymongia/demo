import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AiApp } from './ai/AiApp';
import { IdeasPage } from './ai/IdeasPage';
import { ExpressApp } from './express/ExpressApp';
import './styles/app.css';
import './styles/ai.css';

// `?journey=express` is the shorter journey, `?journey=ai` the AI-first one and `?view=ai-ideas` the ideas
// behind it; anything else is the full Figma journey.
const params = new URLSearchParams(window.location.search);
const journey = params.get('journey');
const page =
  params.get('view') === 'ai-ideas' ? <IdeasPage /> : journey === 'ai' ? <AiApp /> : journey === 'express' ? <ExpressApp /> : <App />;

createRoot(document.getElementById('root')!).render(<StrictMode>{page}</StrictMode>);
