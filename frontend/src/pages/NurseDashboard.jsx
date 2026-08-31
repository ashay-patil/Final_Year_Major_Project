import React, { useEffect, useState } from "react";
import {
  Container, Typography, Paper, Box, Grid, Avatar, Button, TextField, CircularProgress, Checkbox, IconButton, Snackbar, Drawer
} from "@mui/material";
import FaceIcon from "@mui/icons-material/Face";
import HealingIcon from "@mui/icons-material/Healing";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";

const NurseDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskNotes, setTaskNotes] = useState({});
  const [editTasks, setEditTasks] = useState({});
  const [checkedTasks, setCheckedTasks] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, msg: "" });
  const [drawer, setDrawer] = useState({ open: false, patient: null });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await apiService.getNurseTasks();
        setPatients(resp.data.patients || []);
      } catch (e) {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Per-patient task editing
  const handleTaskChange = (pid, index, val) => {
    setEditTasks((prev) => ({
      ...prev,
      [pid]: prev[pid]?.map((t, i) => (i === index ? val : t)) || [],
    }));
  };

  // Per-patient checkbox values
  const handleCheckboxChange = (pid, idx) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [pid]: { ...(prev[pid] || {}), [idx]: !prev[pid]?.[idx] }
    }));
  };

  // Add new checklist item
  const handleAddTask = (pid) => {
    setEditTasks((prev) => ({
      ...prev,
      [pid]: [...(prev[pid] || []), ""],
    }));
  };

  // Remove checklist item
  const handleRemoveTask = (pid, idx) => {
    setEditTasks((prev) => ({
      ...prev,
      [pid]: prev[pid]?.filter((_, i) => i !== idx)
    }));
    setCheckedTasks((prev) => ({
      ...prev,
      [pid]: Object.fromEntries(Object.entries(prev[pid] || {}).filter(([i]) => Number(i) !== idx))
    }));
  };

  // Save/submit all edits & checks
  const handleUpdateChecklist = async (patient) => {
    const pId = patient.patient_id;
    const checklist = (editTasks[pId] || patient.pending_nurse_tasks).filter((t) => t && t.trim());
    const checked = checkedTasks[pId] || {};
    // Save to backend
    await apiService.updateNurseChecklist(pId, {
      checklist,
      checked,
      note: taskNotes[pId] || "",
    });
    setSnackbar({ open: true, msg: "Checklist updated for " + patient.name });
    setPatients(patients.filter((p) => p.patient_id !== pId)); // Optimistic remove
  };

  // Completion note
  const handleNoteChange = (id, val) => setTaskNotes({ ...taskNotes, [id]: val });

  // Show details modal
  const handleOpenDrawer = (patient) => setDrawer({ open: true, patient });
  const handleCloseDrawer = () => setDrawer({ open: false, patient: null });

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 3 }}>
      <Box mb={2}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3, fontWeight: 700 }}
          onClick={() => navigate("/")}
        >
          Back to Hospital Dashboard
        </Button>
      </Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Nurse Station – Discharge Tasks
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={4}>
        Patients ready for discharge: complete vital checks, checklist, and handoff notes.
      </Typography>
      {loading ? (
        <CircularProgress sx={{ mt: 6 }} />
      ) : patients.length === 0 ? (
        <Typography sx={{ mt: 6, color: "#888", fontSize: "1.2rem" }}>
          No patients requiring nursing discharge at this time.
        </Typography>
      ) : (
        <Grid container spacing={4}>
          {patients.map((patient) => {
            const pId = patient.patient_id;
            const currTasks = editTasks[pId] || patient.pending_nurse_tasks || [];
            const currChecks = checkedTasks[pId] || {};
            return (
              <Grid item xs={12} md={6} key={pId}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar src={patient.photo_url} sx={{ bgcolor: "#e1f5e5", mr: 2 }}>
                      <FaceIcon color="action" />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {patient.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {patient.diagnosis}, Age: {patient.age}
                      </Typography>
                    </Box>
                    <IconButton sx={{ ml: "auto" }} onClick={() => handleOpenDrawer(patient)}>
                      <InfoOutlinedIcon />
                    </IconButton>
                  </Box>
                  <Box mb={2}>
                    <Typography fontWeight={700} sx={{ fontSize: "1.09rem" }} mb={1}>
                      Checklist:
                    </Typography>
                    <Box component="ul" sx={{ mb: 2, pl: 3 }}>
                      {currTasks.map((task, idx) => (
                        <li key={idx} style={{ display: "flex", alignItems: "center" }}>
                          <Checkbox
                            checked={!!currChecks[idx]}
                            onChange={() => handleCheckboxChange(pId, idx)}
                            color="success"
                          />
                          <TextField
                            value={task}
                            onChange={e => handleTaskChange(pId, idx, e.target.value)}
                            sx={{ mx: 1, flex: 1 }}
                            size="small"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveTask(pId, idx)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </li>
                      ))}
                    </Box>
                    <Button
                      startIcon={<AddIcon />}
                      variant="text"
                      sx={{ mt: 0, mb: 2, fontWeight: 600 }}
                      onClick={() => handleAddTask(pId)}
                    >
                      Add Checklist Item
                    </Button>
                  </Box>
                  <TextField
                    label="Handover / Completion Note"
                    value={taskNotes[pId] || ""}
                    onChange={e => handleNoteChange(pId, e.target.value)}
                    multiline
                    minRows={2}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<TaskAltIcon />}
                    color="success"
                    fullWidth
                    onClick={() => handleUpdateChecklist(patient)}
                    sx={{ fontWeight: 700, py: 1.2, fontSize: "1rem" }}
                  >
                    Save & Mark Complete
                  </Button>
                </Paper>
                {/* Detail Drawer/Modal */}
                <Drawer
                  anchor="right"
                  open={drawer.open && drawer.patient?.patient_id === pId}
                  onClose={handleCloseDrawer}
                  PaperProps={{ sx: { width: 340, p: 3 } }}
                >
                  <Box>
                    <Typography variant="h5" mb={2}>Patient Details</Typography>
                    <Typography>Name: {patient.name}</Typography>
                    <Typography>MRN: {patient.patient_id}</Typography>
                    <Typography>Age: {patient.age}</Typography>
                    <Typography mb={2}>Diagnosis: {patient.diagnosis}</Typography>
                    <Typography fontWeight={700} sx={{ mt: 2, mb: 1 }}>Recent Vitals:</Typography>
                    <Typography color="text.secondary">
                      BP: {patient.vital_signs?.blood_pressure}<br />
                      HR: {patient.vital_signs?.heart_rate}<br />
                      Temp: {patient.vital_signs?.temperature}°C
                    </Typography>
                  </Box>
                </Drawer>
              </Grid>
            );
          })}
        </Grid>
      )}
      {/* Snackbar for success notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        message={snackbar.msg}
        onClose={() => setSnackbar({ open: false, msg: "" })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      />
    </Container>
  );
};

export default NurseDashboard;
