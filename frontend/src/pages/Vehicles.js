import generateYearOptions from "../utils/generateYears";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { vehicles } from "../services/api";

const yearOptions = generateYearOptions();

export default function Vehicles() {
  const [vehicleList, setVehicleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    licensePlate: "",
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicles.getAll();
      setVehicleList(response?.data?.data);
    } catch (err) {
      setError("Failed to fetch vehicles");
      console.error("Vehicles fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        make: "",
        model: "",
        year: "",
        licensePlate: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVehicle(null);
    setFormData({
      make: "",
      model: "",
      year: "",
      licensePlate: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await vehicles.update(editingVehicle._id, formData);
      } else {
        await vehicles.create(formData);
      }
      handleCloseDialog();
      fetchVehicles();
    } catch (err) {
      setError("Failed to save vehicle");
      console.error("Vehicle save error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await vehicles.delete(id);
        fetchVehicles();
      } catch (err) {
        setError("Failed to delete vehicle");
        console.error("Vehicle delete error:", err);
      }
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
        <Typography variant="h5">Vehicles</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Vehicle
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {vehicleList.map((vehicle) => (
          <Grid item xs={12} sm={6} md={4} key={vehicle._id}>
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
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleOpenDialog(vehicle)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(vehicle._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Make"
              name="make"
              value={formData.make}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              select
              fullWidth
              // label="Year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              margin="normal"
              required
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Select a year</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="License Plate"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingVehicle ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
