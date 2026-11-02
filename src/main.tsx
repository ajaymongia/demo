import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ExpressApp } from './express/ExpressApp';
import './styles/app.css';

// `?journey=express` opens the shorter journey; anything else is the full Figma journey.
const express = new URLSearchParams(window.location.search).get('journey') === 'express';

createRoot(document.getElementById('root')!).render(<StrictMode>{express ? <ExpressApp /> : <App />}</StrictMode>);
