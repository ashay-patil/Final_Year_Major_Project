import React from 'react';
import { Card, CardContent, Typography, Chip, Grid, Box } from '@mui/material';

const PatientCard = ({ patient }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      default: return 'default';
    }
  };

  const getDischargeStatusColor = (ready) => {
    return ready ? 'success' : 'error';
  };

  return (
    <Card sx={{ mb: 2, boxShadow: 2 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" component="h2">
              {patient.name}
            </Typography>
            <Typography color="textSecondary">
              ID: {patient.patient_id} | Age: {patient.age}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Diagnosis:</strong> {patient.diagnosis}
            </Typography>
            <Typography variant="body2">
              <strong>Admission:</strong> {patient.admission_date}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" gutterBottom>
              Vital Signs
            </Typography>
            <Typography variant="body2">
              BP: {patient.vital_signs.blood_pressure}
            </Typography>
            <Typography variant="body2">
              HR: {patient.vital_signs.heart_rate} bpm
            </Typography>
            <Typography variant="body2">
              Temp: {patient.vital_signs.temperature}°F
            </Typography>
            <Typography variant="body2">
              O2: {patient.vital_signs.oxygen_saturation}%
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box display="flex" flexDirection="column" gap={1}>
              <Chip 
                label={`Treatment: ${patient.treatment_status}`}
                color={getStatusColor(patient.treatment_status)}
                size="small"
              />
              <Chip 
                label={patient.ready_for_discharge ? 'Ready for Discharge' : 'Not Ready'}
                color={getDischargeStatusColor(patient.ready_for_discharge)}
                size="small"
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PatientCard;
