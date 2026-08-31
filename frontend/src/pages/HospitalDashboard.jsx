import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Paper, Typography, Box, Button, Grid } from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PersonIcon from "@mui/icons-material/Person";
import NursingIcon from "@mui/icons-material/Face"; // You can use a nurse icon if available
import ReceiptIcon from "@mui/icons-material/Receipt";
import SummarizeIcon from "@mui/icons-material/Summarize";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";

const roles = [
  {
    name: "Doctor Dashboard",
    path: "/doctor-dashboard",
    icon: <PersonIcon fontSize="large" color="primary" />
  },
  {
    name: "Nurse Dashboard",
    path: "/nurse-dashboard",
    icon: <NursingIcon fontSize="large" color="primary" />
  },
  {
    name: "Discharge Summary",
    path: "/summary-dashboard",
    icon: <SummarizeIcon fontSize="large" color="primary" />
  },
  {
    name: "Pharmacy Dashboard",
    path: "/pharmacy-dashboard",
    icon: <LocalPharmacyIcon fontSize="large" color="primary" />
  },
  {
    name: "Billing Dashboard",
    path: "/billing-dashboard",
    icon: <ReceiptIcon fontSize="large" color="primary" />
  }
];

const HospitalDashboard = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Paper sx={{ p: 5, borderRadius: 4, background: "#f9fafc" }}>
        <Box textAlign="center" mb={4}>
          <LocalHospitalIcon sx={{ fontSize: 56, color: "#2563eb" }} />
          <Typography variant="h4" fontWeight="bold" mt={2} color="primary.main">
            Hospital Workflow Agent Demo
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" mt={1}>
            Choose an agent dashboard to begin:
          </Typography>
        </Box>
        <Grid container spacing={4} justifyContent="center">
          {roles.map((role, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Paper sx={{ p: 3, borderRadius: 2, textAlign: "center", height: 160 }}>
                <Box mb={2}>{role.icon}</Box>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ fontWeight: 600, fontSize: "1.1rem" }}
                  onClick={() => navigate(role.path)}
                >
                  {role.name}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default HospitalDashboard;
