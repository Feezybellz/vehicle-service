import React, { useState, useEffect, useRef } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import { vehicles, vehicleServices } from "../services/api";

function cleanDate(utcDateString) {
  const date = new Date(utcDateString);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const [vehicleData, setVehicleData] = useState([]);
  const [upcomingServices, setUpcomingServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current === false) {
      fetchData();
      effectRan.current = true;
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehiclesResponse, upcomingServicesResponse] = await Promise.all([
        vehicles.getAll(),
        vehicleServices.upcomingServices(),
      ]);
      setVehicleData(vehiclesResponse?.data?.data);
      setUpcomingServices(upcomingServicesResponse?.data?.data);
    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Vehicles Overview */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Your Vehicles
          </Typography>
          <Grid container spacing={2}>
            {vehicleData.map((vehicle) => (
              <Grid item xs={12} key={vehicle._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      {vehicle.make} {vehicle.model}
                    </Typography>
                    <Typography color="textSecondary">
                      Year: {vehicle.year}
                    </Typography>
                    <Typography color="textSecondary">
                      License Plate: {vehicle.licensePlate}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" color="primary">
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Upcoming Services
          </Typography>
          <List>
            {upcomingServices.map((service) => (
              <ListItem key={service._id}>
                <ListItemText
                  primary={`${service.vehicle.make} ${service.vehicle.model} - ${service.serviceType}`}
                  secondary={`${cleanDate(service.nextServiceDate)}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
}
