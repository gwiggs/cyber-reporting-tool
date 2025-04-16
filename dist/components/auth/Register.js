import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { TextField, Button, Typography, Box, Card, CardContent, Alert, CircularProgress, MenuItem, Select, FormControl, InputLabel, FormHelperText } from '@mui/material';
import { register, clearError } from '../../redux/slices/authSlice';
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
    firstName: yup
        .string()
        .required('First name is required'),
    lastName: yup
        .string()
        .required('Last name is required'),
    role: yup
        .string()
        .oneOf(['admin', 'manager', 'user'], 'Please select a valid role')
        .required('Role is required'),
});
const Register = () => {
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
            firstName: '',
            lastName: '',
            role: '',
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            dispatch(register(values));
        },
    });
    return (React.createElement(Box, { className: "auth-container" },
        React.createElement(Card, { className: "auth-card" },
            React.createElement(CardContent, null,
                React.createElement(Typography, { variant: "h4", component: "h1", align: "center", gutterBottom: true }, "Register"),
                error && (React.createElement(Alert, { severity: "error", sx: { my: 2 } }, error)),
                React.createElement("form", { onSubmit: formik.handleSubmit, className: "auth-form" },
                    React.createElement(TextField, { fullWidth: true, id: "email", name: "email", label: "Email", value: formik.values.email, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.email && Boolean(formik.errors.email), helperText: formik.touched.email && formik.errors.email, disabled: isLoading }),
                    React.createElement(TextField, { fullWidth: true, id: "password", name: "password", label: "Password", type: "password", value: formik.values.password, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.password && Boolean(formik.errors.password), helperText: formik.touched.password && formik.errors.password, disabled: isLoading }),
                    React.createElement(TextField, { fullWidth: true, id: "firstName", name: "firstName", label: "First Name", value: formik.values.firstName, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.firstName && Boolean(formik.errors.firstName), helperText: formik.touched.firstName && formik.errors.firstName, disabled: isLoading }),
                    React.createElement(TextField, { fullWidth: true, id: "lastName", name: "lastName", label: "Last Name", value: formik.values.lastName, onChange: formik.handleChange, onBlur: formik.handleBlur, error: formik.touched.lastName && Boolean(formik.errors.lastName), helperText: formik.touched.lastName && formik.errors.lastName, disabled: isLoading }),
                    React.createElement(FormControl, { fullWidth: true, error: formik.touched.role && Boolean(formik.errors.role), disabled: isLoading },
                        React.createElement(InputLabel, { id: "role-label" }, "Role"),
                        React.createElement(Select, { labelId: "role-label", id: "role", name: "role", value: formik.values.role, label: "Role", onChange: formik.handleChange, onBlur: formik.handleBlur },
                            React.createElement(MenuItem, { value: "admin" }, "Admin"),
                            React.createElement(MenuItem, { value: "manager" }, "Manager"),
                            React.createElement(MenuItem, { value: "user" }, "User")),
                        formik.touched.role && formik.errors.role && (React.createElement(FormHelperText, null, formik.errors.role))),
                    React.createElement(Button, { color: "primary", variant: "contained", fullWidth: true, type: "submit", disabled: isLoading, className: "auth-submit" }, isLoading ? React.createElement(CircularProgress, { size: 24 }) : 'Register')),
                React.createElement(Box, { className: "auth-toggle" },
                    React.createElement(Typography, { variant: "body2" },
                        "Already have an account?",
                        ' ',
                        React.createElement(Button, { color: "primary", onClick: () => navigate('/login'), disabled: isLoading }, "Login")))))));
};
export default Register;
