import React, { useState, useEffect } from "react";
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
  const [reminderData, setReminderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehiclesResponse, remindersResponse] = await Promise.all([
        vehicles.getAll(),
        reminders.getAll(),
      ]);
      setVehicleData(vehiclesResponse.data);
      setReminderData(remindersResponse.data);
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

      {/* Upcoming Service Reminders */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Upcoming Service Reminders
          </Typography>
          <List>
            {reminderData
              .filter((reminder) => !reminder.completed)
              .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
              .slice(0, 5)
              .map((reminder) => (
                <React.Fragment key={reminder._id}>
                  <ListItem>
                    <ListItemText
                      primary={reminder.title}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="textPrimary"
                          >
                            Due:{" "}
                            {format(new Date(reminder.dueDate), "MMM dd, yyyy")}
                          </Typography>
                          <br />
                          {reminder.description}
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
          </List>
          {reminderData.filter((reminder) => !reminder.completed).length ===
            0 && (
            <Typography color="textSecondary" sx={{ p: 2 }}>
              No upcoming service reminders
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
