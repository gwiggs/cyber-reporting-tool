import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import App from './App';
import './styles/global.css';
const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(React.StrictMode, null,
    React.createElement(Provider, { store: store },
        React.createElement(App, null))));
