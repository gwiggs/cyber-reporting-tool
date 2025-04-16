import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Typography, 
  Button, 
  AppBar, 
  Toolbar, 
  Container, 
  Box,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { logout } from '../redux/slices/authSlice';
import { RootState, AppDispatch } from '../redux/store';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Enterprise Task Management
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container sx={{ mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="subtitle1">
            Welcome, {user?.firstName} {user?.lastName}!
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  My Tasks
                </Typography>
                <Typography variant="body2">
                  No tasks assigned yet.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Status
                </Typography>
                <Typography variant="body2">
                  No team data available.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resources
                </Typography>
                <Typography variant="body2">
                  No resources allocated.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Dashboard; 