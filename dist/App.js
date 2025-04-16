import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
// Create theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#f5f5f5',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
});
// Protected route wrapper
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    if (!isAuthenticated) {
        return React.createElement(Navigate, { to: "/login" });
    }
    return React.createElement(React.Fragment, null, children);
};
const App = () => {
    return (React.createElement(ThemeProvider, { theme: theme },
        React.createElement(CssBaseline, null),
        React.createElement(BrowserRouter, null,
            React.createElement(Routes, null,
                React.createElement(Route, { path: "/login", element: React.createElement(Login, null) }),
                React.createElement(Route, { path: "/register", element: React.createElement(Register, null) }),
                React.createElement(Route, { path: "/dashboard", element: React.createElement(ProtectedRoute, null,
                        React.createElement(Dashboard, null)) }),
                React.createElement(Route, { path: "*", element: React.createElement(Navigate, { to: "/login" }) })))));
};
export default App;
