import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, Button, AppBar, Toolbar, Container, Box, Card, CardContent, Grid } from '@mui/material';
import { logout } from '../redux/slices/authSlice';
const Dashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const handleLogout = () => {
        dispatch(logout());
    };
    return (React.createElement(React.Fragment, null,
        React.createElement(AppBar, { position: "static" },
            React.createElement(Toolbar, null,
                React.createElement(Typography, { variant: "h6", component: "div", sx: { flexGrow: 1 } }, "Enterprise Task Management"),
                React.createElement(Button, { color: "inherit", onClick: handleLogout }, "Logout"))),
        React.createElement(Container, { sx: { mt: 4 } },
            React.createElement(Box, { sx: { mb: 4 } },
                React.createElement(Typography, { variant: "h4", component: "h1", gutterBottom: true }, "Dashboard"),
                React.createElement(Typography, { variant: "subtitle1" },
                    "Welcome, ", user === null || user === void 0 ? void 0 :
                    user.firstName,
                    " ", user === null || user === void 0 ? void 0 :
                    user.lastName,
                    "!")),
            React.createElement(Grid, { container: true, spacing: 3 },
                React.createElement(Grid, { item: true, xs: 12, md: 4 },
                    React.createElement(Card, null,
                        React.createElement(CardContent, null,
                            React.createElement(Typography, { variant: "h6", gutterBottom: true }, "My Tasks"),
                            React.createElement(Typography, { variant: "body2" }, "No tasks assigned yet.")))),
                React.createElement(Grid, { item: true, xs: 12, md: 4 },
                    React.createElement(Card, null,
                        React.createElement(CardContent, null,
                            React.createElement(Typography, { variant: "h6", gutterBottom: true }, "Team Status"),
                            React.createElement(Typography, { variant: "body2" }, "No team data available.")))),
                React.createElement(Grid, { item: true, xs: 12, md: 4 },
                    React.createElement(Card, null,
                        React.createElement(CardContent, null,
                            React.createElement(Typography, { variant: "h6", gutterBottom: true }, "Resources"),
                            React.createElement(Typography, { variant: "body2" }, "No resources allocated."))))))));
};
export default Dashboard;
