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
import { vehicles, reminders } from "../services/api";
import { format } from "date-fns";

export default function Dashboard() {
  const [vehicleData, setVehicleData] = useState([]);

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
      const [vehiclesResponse] = await Promise.all([vehicles.getAll()]);
      setVehicleData(vehiclesResponse?.data?.data);
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
    </Grid>
  );
}
