import React, { useState, useEffect } from "react";
import {
  Box, Container, Typography, Grid, Paper, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, List, ListItem, ListItemAvatar, ListItemText
} from "@mui/material";
import { PlayArrow, Refresh } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";

const statCardStyle = {
  p: 3,
  minWidth: 220,
  textAlign: "center",
  background: "#fff",
  borderRadius: 16
};

const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const readyCount = patients.filter(p => p.ready_for_discharge).length;
  const totalCount = patients.length;
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
    fetchLogs();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await apiService.getPatients();
      setPatients(response.data.patients);
    } catch (e) { }
  };
  const fetchLogs = async () => {
    try {
      const response = await apiService.getDischargeLog();
      setLogs(response.data.logs);
    } catch (e) { }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  // Table row click handler
  const handleRowClick = (patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  };

  const handleDialogClose = () => { setDialogOpen(false); setSelectedPatient(null); };

  const handleDoctorApprove = () => {
    setDialogOpen(false);
    navigate(`/summary/${selectedPatient.patient_id}`);
  };

  return (
    <Box sx={{ background: "#f7fafc", minHeight: "100vh" }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" py={4}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar src="/logo.png" alt="Hospital Logo" sx={{ bgcolor: "#e0e7ef" }} />
            <Typography variant="h6" fontWeight={700}>St. Jude's Hospital</Typography>
          </Box>
          <Avatar sx={{ bgcolor: "#fde68a" }} /> {/* User Avatar */}
        </Box>
        {/* Title & Buttons */}
        <Typography variant="h4" fontWeight={700} mb={1}>Discharge Management Dashboard</Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={4}>
          AI-powered assistant to identify patients ready for discharge.
        </Typography>
        <Box display="flex" gap={2} mb={4}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 8 }}
            onClick={() => { setLoading(true); /* trigger workflow here */ }}
            disabled={loading}
          >
            Run Discharge Detection
          </Button>
          <Button
            variant="outlined"
            color="primary"
            sx={{ borderRadius: 8, textTransform: "none", fontWeight: 600 }}
            startIcon={<Refresh />}
            onClick={fetchPatients}
          >
            Refresh
          </Button>
        </Box>
        {/* Stat Cards */}
        <Box display="flex" gap={3} mb={4} flexWrap="wrap">
          <Paper sx={statCardStyle} elevation={0}>
            <Typography variant="subtitle1">Total Patients</Typography>
            <Typography variant="h3" fontWeight={800}>{totalCount}</Typography>
          </Paper>
          <Paper sx={statCardStyle} elevation={0}>
            <Typography variant="subtitle1">Ready for Discharge</Typography>
            <Typography variant="h3" color="primary" fontWeight={800}>{readyCount}</Typography>
          </Paper>
          <Paper sx={statCardStyle} elevation={0}>
            <Typography variant="subtitle1">In Treatment</Typography>
            <Typography variant="h3" color="warning.main" fontWeight={800}>{totalCount - readyCount}</Typography>
          </Paper>
        </Box>
        {/* Main: Table & Recent Activity */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Patient Table */}
            <Paper elevation={0} sx={{ borderRadius: 16, p: 2, background: "#fff" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Avatar</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Patient ID</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Diagnosis</TableCell>
                    <TableCell>Treatment Status</TableCell>
                    <TableCell>Ready for Discharge</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((patient) => (
                    <TableRow
                      key={patient.patient_id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => handleRowClick(patient)}
                    >
                      <TableCell>
                        <Avatar src={patient.photo_url} alt={patient.name} sx={{ width: 40, height: 40 }} />
                      </TableCell>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell>{patient.patient_id}</TableCell>
                      <TableCell>{patient.age}</TableCell>
                      <TableCell>{patient.diagnosis}</TableCell>
                      <TableCell>{patient.treatment_status}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            px: 2, py: 0.7, borderRadius: 20,
                            background: patient.ready_for_discharge ? "#d1fae5" : "#fef3c7",
                            color: patient.ready_for_discharge ? "#10b981" : "#f59e42",
                            display: "inline-block",
                            fontWeight: 600,
                            fontSize: "0.95rem"
                          }}
                        >
                          {patient.ready_for_discharge ? "YES" : "NO"}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={patients.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10]}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            {/* Recent Activity */}
            <Paper elevation={0} sx={{ borderRadius: 16, p: 3, background: "#fff" }}>
              <Typography variant="h6" fontWeight={700} mb={1}>Recent Activity</Typography>
              <List>
                {logs.slice(0, 5).map((log, idx) => (
                  <ListItem key={idx} sx={{ mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "#e8f0fe", width: 28, height: 28 }}>
                        {/* Optionally use different icons for types */}
                        {/* <SomeIcon /> */}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={500}>{log.details || log.message}</Typography>}
                      secondary={<Typography variant="caption" color="textSecondary">{log.timestamp}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
        {/* Doctor Confirm Dialog */}
        <Dialog open={dialogOpen} onClose={handleDialogClose}>
          <DialogTitle>Discharge Confirmation</DialogTitle>
          <DialogContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar src={selectedPatient?.photo_url} alt={selectedPatient?.name} sx={{ width: 64, height: 64 }} />
              <Box>
                <Typography variant="h6">{selectedPatient?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedPatient?.diagnosis}</Typography>
                <Typography variant="body2" color="text.secondary">ID: {selectedPatient?.patient_id}</Typography>
              </Box>
            </Box>
            <Typography>Are you sure you want to discharge this patient?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} variant="outlined" color="secondary">No</Button>
            <Button onClick={handleDoctorApprove} variant="contained" color="primary">Yes, Discharge</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Dashboard;
