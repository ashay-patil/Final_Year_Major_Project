import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container, Paper, Typography, Box, Avatar, CircularProgress, Button, Divider
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { apiService } from "../services/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const labelStyle = { fontWeight: 700, mb: 1 };

// Section parser: finds headings (with or without double asterisks), treats next lines beginning with "-" as bullets
function parseSummarySections(summaryStr) {
  const lines = summaryStr
    .replace(/\r\n/g, "\n")
    .replace(/\*\*/g, "") // Remove double asterisks from markdown headings
    .split("\n")
    .filter(l => l.trim().length > 0);

  const blocks = [];
  let currentBlock = null;
  lines.forEach(line => {
    const headingMatch = line.match(
      /^(AI-Generated Summary|Treatment Summary|Patient Improvement|Final Diagnosis|Follow-up Advice|Doctor's Comments)/i
    );
    if (headingMatch) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { title: headingMatch[0], items: [] };
    } else if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
      currentBlock?.items.push(line.replace(/^[-•]\s*/, ""));
    } else {
      currentBlock?.items.push(line.trim());
    }
  });
  if (currentBlock) blocks.push(currentBlock);
  return blocks;
}

const SummaryPage = () => {
  const { patient_id } = useParams();
  const [summary, setSummary] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  // Make summaryRef cover everything you see/export.
  const summaryRef = useRef();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const patientResp = await apiService.getPatient(patient_id);
        setPatient(patientResp.data.patient);
        const summaryResp = await apiService.getPatientSummary(patient_id);
        setSummary(summaryResp.data.summary);
      } catch (err) {
        setSummary("Summary not available.");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [patient_id]);

  const handleDownloadPDF = async () => {
    const input = summaryRef.current;
    const canvas = await html2canvas(input, { backgroundColor: "#fff", scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
    pdf.save(`discharge-summary-${patient_id}.pdf`);
  };

  if (loading || !patient)
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center">
          <CircularProgress />
        </Box>
      </Container>
    );

  const sections = summary ? parseSummarySections(summary) : [];
  const doctorComments = sections.find(b => /doctor'?s? comments/i.test(b.title));
  const mainBlocks = sections.filter(b => b.title !== "Doctor's Comments");

  // The ref covers all exportable info and only vertical layout styles!
  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
      <Box component={Link} to="/" sx={{ textDecoration: "none", display: "flex", alignItems: "center", mb: 3 }}>
        <ArrowBackIcon sx={{ mr: 1 }} color="primary" />
        <Typography color="primary">Back to Dashboard</Typography>
      </Box>
      {/* All summary content for export inside single Paper */}
      <Paper ref={summaryRef}
        sx={{
          p: 4,
          borderRadius: 3,
          mb: 4,
          background: "#fff",
          minWidth: 500,
          width: "100%", // covers full card, not only header
        }}>
        {/* Header: patient info and download button (vertical layout) */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar src={patient.photo_url} alt={patient.name} sx={{ width: 80, height: 80, mr: 3 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Discharge Summary for {patient.name}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: "1rem" }}>
              MRN: {patient.patient_id}
              {patient.dob ? ` | DOB: ${patient.dob}` : ""}
              {patient.age ? ` | Age: ${patient.age}` : ""}
            </Typography>
          </Box>
          <Box flex="1" />
          <Button
            onClick={handleDownloadPDF}
            startIcon={<PictureAsPdfIcon />}
            variant="contained"
            sx={{ fontWeight: 600, height: 44, ml: 4 }}
          >
            Download PDF
          </Button>
        </Box>
        <Divider sx={{ mb: 4 }} />
        {/* Summary sections */}
        {mainBlocks.map((block, idx) => (
          <Box key={idx} sx={{ mb: 3 }}>
            <Typography variant={idx === 0 ? "h6" : "subtitle1"} fontWeight={700} sx={{ mb: 1 }}>
              {block.title}
            </Typography>
            {block.items.map((item, iidx) => (
              <Typography key={iidx} sx={{ pl: 1, mb: 0.5 }}>
                {item}
              </Typography>
            ))}
            <Divider sx={{ mt: 2, mb: 2 }} />
          </Box>
        ))}
        {/* Doctor Comments included in export */}
        {doctorComments && (
          <Paper sx={{ p: 3, borderRadius: 3, background: "#fbfbfb", boxShadow: "none", mt: 2 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>Doctor's Comments</Typography>
            {doctorComments.items.map((c, i) => (
              <Typography key={i}>{c}</Typography>
            ))}
          </Paper>
        )}
      </Paper>
    </Container>
  );
};

export default SummaryPage;
