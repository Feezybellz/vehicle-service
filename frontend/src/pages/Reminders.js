import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { vehicles, reminders } from "../services/api";
import { format } from "date-fns";

export default function Reminders() {
  const [reminderList, setReminderList] = useState([]);
  const [vehicleList, setVehicleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [formData, setFormData] = useState({
    vehicle: "",
    title: "",
    description: "",
    dueDate: new Date(),
    reminderType: "maintenance",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [remindersResponse, vehiclesResponse] = await Promise.all([
        reminders.getAll(),
        vehicles.getAll(),
      ]);
      setReminderList(remindersResponse.data);
      setVehicleList(vehiclesResponse.data);
    } catch (err) {
      setError("Failed to fetch data");
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (reminder = null) => {
    if (reminder) {
      setEditingReminder(reminder);
      setFormData({
        vehicle: reminder.vehicle._id,
        title: reminder.title,
        description: reminder.description,
        dueDate: new Date(reminder.dueDate),
        reminderType: reminder.reminderType,
      });
    } else {
      setEditingReminder(null);
      setFormData({
        vehicle: "",
        title: "",
        description: "",
        dueDate: new Date(),
        reminderType: "maintenance",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingReminder(null);
    setFormData({
      vehicle: "",
      title: "",
      description: "",
      dueDate: new Date(),
      reminderType: "maintenance",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      dueDate: date,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReminder) {
        await reminders.update(editingReminder._id, formData);
      } else {
        await reminders.create(formData);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      setError("Failed to save reminder");
      console.error("Reminder save error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this reminder?")) {
      try {
        await reminders.delete(id);
        fetchData();
      } catch (err) {
        setError("Failed to delete reminder");
        console.error("Reminder delete error:", err);
      }
    }
  };

  const handleComplete = async (id) => {
    try {
      await reminders.complete(id);
      fetchData();
    } catch (err) {
      setError("Failed to mark reminder as complete");
      console.error("Reminder complete error:", err);
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

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">Service Reminders</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Reminder
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {reminderList.map((reminder) => (
          <Grid item xs={12} sm={6} md={4} key={reminder._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{reminder.title}</Typography>
                <Typography color="textSecondary">
                  Vehicle: {reminder.vehicle.make} {reminder.vehicle.model}
                </Typography>
                <Typography color="textSecondary">
                  Due: {format(new Date(reminder.dueDate), "MMM dd, yyyy")}
                </Typography>
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                  {reminder.description}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={reminder.reminderType}
                    color="primary"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {reminder.completed && (
                    <Chip label="Completed" color="success" size="small" />
                  )}
                </Box>
              </CardContent>
              <CardActions>
                {!reminder.completed && (
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => handleComplete(reminder._id)}
                  >
                    <CheckIcon />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleOpenDialog(reminder)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(reminder._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingReminder ? "Edit Reminder" : "Add Reminder"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Vehicle</InputLabel>
              <Select
                name="vehicle"
                value={formData.vehicle}
                onChange={handleChange}
                required
              >
                {vehicleList.map((vehicle) => (
                  <MenuItem key={vehicle._id} value={vehicle._id}>
                    {vehicle.make} {vehicle.model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={3}
              required
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField {...params} fullWidth margin="normal" required />
                )}
              />
            </LocalizationProvider>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                name="reminderType"
                value={formData.reminderType}
                onChange={handleChange}
                required
              >
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="inspection">Inspection</MenuItem>
                <MenuItem value="repair">Repair</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingReminder ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
