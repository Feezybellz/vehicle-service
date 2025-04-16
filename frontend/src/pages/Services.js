import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  // MenuItem,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";

import { vehicleServices, vehicles } from "../services/api";

function toLocalDate(utcDateString) {
  if (!utcDateString) return "";

  const date = new Date(utcDateString);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16); // Format for datetime-local input:
}

const Services = () => {
  const [services, setServices] = useState([]);
  const [vehiclesArray, setVehicles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    vehicle: "",
    serviceType: "",
    serviceDate: "",
    nextServiceDate: "",
    mileage: "",
    cost: "",
    notes: "",
    serviceProvider: "",
  });
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const navigate = useNavigate();

  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current === false) {
      fetchServices();
      effectRan.current = true;
    }
  }, []);

  const fetchServices = async () => {
    try {
      const response = await vehicleServices.getAll();
      setServices(response?.data?.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await vehicles.getAll();
      setVehicles(response?.data?.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleOpenDialog = async (service = null) => {
    await fetchVehicles();
    if (service) {
      setSelectedService(service);
      setFormData({
        vehicle: service.vehicle._id,
        serviceType: service.serviceType,
        serviceDate: new Date(service.serviceDate).toISOString().split("T")[0],
        nextServiceDate: service.nextServiceDate,
        cost: service.cost,
        notes: service.notes || "",
        serviceProvider: service.serviceProvider || "",
      });
    } else {
      setSelectedService(null);
      setFormData({
        vehicle: "",
        serviceType: "",
        serviceDate: "",
        nextServiceDate: "",
        mileage: "",
        cost: "",
        notes: "",
        serviceProvider: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedService(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (
        name === "nextServiceDate" &&
        updated.nextServiceDate &&
        new Date(updated.nextServiceDate) < new Date(updated.serviceDate)
      ) {
        updated.nextServiceDate = updated.serviceDate;
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedService) {
        await vehicleServices.update(selectedService._id, formData);
      } else {
        await vehicleServices.create(formData);
      }
      fetchServices();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving service:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await vehicleServices.delete(id);
        fetchServices();
      } catch (error) {
        console.error("Error deleting service:", error);
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Vehicle Services
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            Add New Service
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle</TableCell>
                <TableCell>Service Type</TableCell>
                <TableCell>Service Date</TableCell>
                <TableCell>Next Service</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service._id}>
                  <TableCell>
                    {service.vehicle.make} {service.vehicle.model} -{" "}
                    {service.vehicle.licensePlate}
                  </TableCell>
                  <TableCell>{service.serviceType}</TableCell>
                  <TableCell>
                    {new Date(service.serviceDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(service.nextServiceDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>₦{service.cost}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(service)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(service._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedService ? "Edit Service" : "Add New Service"}
          </DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                select
                fullWidth
                // label="Vehicle"
                name="vehicleId"
                value={formData.vehicle}
                onChange={handleInputChange}
                margin="normal"
                required
                disabled={loadingVehicles}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="" disabled>
                  Select a vehicle
                </option>
                {loadingVehicles ? (
                  <option value="" disabled>
                    Loading vehicles...
                  </option>
                ) : (
                  vehiclesArray.map((vehicle) => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.make} {vehicle.model} - {vehicle.licensePlate}
                    </option>
                  ))
                )}
              </TextField>
              <TextField
                fullWidth
                label="Service Type"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Service Date"
                name="serviceDate"
                type="date"
                value={formData.serviceDate}
                onChange={handleInputChange}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Next Service Date"
                name="nextServiceDate"
                type="datetime-local"
                value={toLocalDate(formData.nextServiceDate)}
                InputLabelProps={{ shrink: true }}
                // Set min attribute to the current serviceDate value to prevent earlier dates
                inputProps={{
                  min: formData.serviceDate ? formData.serviceDate : "",
                }}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Cost"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Service Provider"
                name="serviceProvider"
                value={formData.serviceProvider}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                margin="normal"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {selectedService ? "Update" : "Add"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Services;
