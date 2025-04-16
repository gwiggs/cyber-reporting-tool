import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { TextField, Button, Typography, Box, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import { login, clearError } from '../../redux/slices/authSlice';
// Validation schema
const validationSchema = yup.object({
    email: yup
        .string()
        .email('Enter a valid email')
        .required('Email is required'),
    password: yup
        .string()
        .min(6, 'Password should be of minimum 6 characters length')
        .required('Password is required'),
});
const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);
    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);
    // Clear errors on unmount
    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);
    // Form handling
    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            dispatch(login(values));
        },
    });
    return (React.createElement(Box, { className: "auth-container" },
        React.createElement(Card, { className: "auth-card" },
            React.createElement(CardContent, null,
                React.createElement(Typography, { variant: "h4", component: "h1", align: "center", gutterBottom: true }, "Login"),
                error && (React.createElement(Alert, { severity: "error", sx: { my: 2 } }, error)),
                React.createElement("form", { onSubmit: formik.handleSubmit, className: "auth-form" },
                    React.createElement(TextField, { fullWidth: true, id: "email", name: "email", label: "Email", value: formik.values.email, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.email && Boolean(formik.errors.email), helperText: formik.touched.email && formik.errors.email, disabled: isLoading }),
                    React.createElement(TextField, { fullWidth: true, id: "password", name: "password", label: "Password", type: "password", value: formik.values.password, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.password && Boolean(formik.errors.password), helperText: formik.touched.password && formik.errors.password, disabled: isLoading }),
                    React.createElement(Button, { color: "primary", variant: "contained", fullWidth: true, type: "submit", disabled: isLoading, className: "auth-submit" }, isLoading ? React.createElement(CircularProgress, { size: 24 }) : 'Login')),
                React.createElement(Box, { className: "auth-toggle" },
                    React.createElement(Typography, { variant: "body2" },
                        "Don't have an account?",
                        ' ',
                        React.createElement(Button, { color: "primary", onClick: () => navigate('/register'), disabled: isLoading }, "Register")))))));
};
export default Login;
