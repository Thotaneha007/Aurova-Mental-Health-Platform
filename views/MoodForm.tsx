import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface Mood {
  moodId: string;
  userId: string;
  date: string;
  moodType: string;
  stressLevel: number;
  sleepHours: number;
  energyLevel: number;
  notes: string;
  consentToShare: boolean;
}

const emptyForm: Mood = {
  moodId: "",
  userId: "",
  date: "",
  moodType: "",
  stressLevel: 0,
  sleepHours: 0,
  energyLevel: 0,
  notes: "",
  consentToShare: false,
};

const MoodForm = () => {
  const [rows, setRows] = useState<Mood[]>([]);
  const [formData, setFormData] = useState<Mood>(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState("");

  // ---------------- FETCH ----------------
  const fetchMoods = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/moods`);
      setRows(res.data);
    } catch (error) {
      alert("Failed to fetch moods");
    }
  };

  useEffect(() => {
    fetchMoods();
  }, []);

  // ---------------- HANDLE CHANGE ----------------
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value,
    });
  };

  // ---------------- VALIDATION ----------------
  const validateForm = () => {
    if (!formData.moodId || !formData.userId || !formData.moodType || !formData.date) {
      alert("Please fill all required fields.");
      return false;
    }
    return true;
  };

  // ---------------- CONFIRM ACTION ----------------
  const confirmAction = async () => {
    if (actionType !== "Delete" && !validateForm()) return;

    try {
      if (actionType === "Insert") {
        await axios.post(`${API_BASE}/api/moods`, formData);
        alert("Mood inserted successfully!");
      }

      if (actionType === "Update") {
        if (!selectedId) {
          alert("Please select a record to update.");
          return;
        }
        await axios.put(
          `${API_BASE}/api/moods/${selectedId}`,
          formData
        );
        alert("Mood updated successfully!");
      }

      if (actionType === "Delete") {
        if (!selectedId) {
          alert("Please select a record to delete.");
          return;
        }
        await axios.delete(
          `${API_BASE}/api/moods/${selectedId}`
        );
        alert("Mood deleted successfully!");
      }

      fetchMoods();
      setDialogOpen(false);
      setFormData(emptyForm);
      setSelectedId(null);
    } catch (error) {
      alert("Operation failed. Check backend.");
    }
  };

  // ---------------- SEARCH ----------------
  const searchById = async () => {
    if (!formData.moodId) {
      alert("Enter Mood ID to search.");
      return;
    }

    try {
      const res = await axios.get(
        `${API_BASE}/api/moods/${formData.moodId}`
      );
      setFormData(res.data);
      setSelectedId(res.data.moodId);
    } catch {
      alert("Mood ID not found.");
    }
  };

  const columns: GridColDef[] = [
    { field: "moodId", headerName: "Mood ID", width: 120 },
    { field: "userId", headerName: "User ID", width: 120 },
    { field: "moodType", headerName: "Mood", width: 120 },
    { field: "stressLevel", headerName: "Stress", width: 100 },
    { field: "sleepHours", headerName: "Sleep", width: 100 },
    { field: "energyLevel", headerName: "Energy", width: 100 },
  ];

  return (
    <div className="min-h-screen flex justify-center items-start pt-24 px-6">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl p-8">

        <h2 className="text-3xl font-bold mb-6 text-primary">
          Mood Tracking Module
        </h2>

        {/* SEARCH BAR */}
        <div className="flex gap-3 mb-6">
          <TextField
            label="Search by Mood ID"
            value={formData.moodId}
            onChange={(e) =>
              setFormData({ ...formData, moodId: e.target.value })
            }
          />
          <Button variant="outlined" onClick={searchById}>
            Search
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setFormData(emptyForm);
              setSelectedId(null);
            }}
          >
            Clear
          </Button>
        </div>

        {/* FORM SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextField fullWidth label="Mood ID" name="moodId" value={formData.moodId} onChange={handleChange} />
          <TextField fullWidth label="User ID" name="userId" value={formData.userId} onChange={handleChange} />
          <TextField fullWidth type="date" name="date" value={formData.date} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <TextField select fullWidth label="Mood" name="moodType" value={formData.moodType} onChange={handleChange}>
            <MenuItem value="Happy">Happy</MenuItem>
            <MenuItem value="Sad">Sad</MenuItem>
            <MenuItem value="Anxious">Anxious</MenuItem>
          </TextField>

          <TextField fullWidth label="Stress Level" name="stressLevel" type="number" value={formData.stressLevel} onChange={handleChange} />
          <TextField fullWidth label="Sleep Hours" name="sleepHours" type="number" value={formData.sleepHours} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <TextField fullWidth label="Energy Level" name="energyLevel" type="number" value={formData.energyLevel} onChange={handleChange} />
          <TextField fullWidth label="Notes" name="notes" multiline rows={3} value={formData.notes} onChange={handleChange} />
        </div>

        <div className="mt-4">
          <FormControlLabel
            control={<Checkbox checked={formData.consentToShare} name="consentToShare" onChange={handleChange} />}
            label="Consent to Share"
          />
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 mt-6">
          <Button variant="contained" onClick={() => { setActionType("Insert"); setDialogOpen(true); }}>
            Insert
          </Button>
          <Button variant="contained" disabled={!selectedId} onClick={() => { setActionType("Update"); setDialogOpen(true); }}>
            Update
          </Button>
          <Button variant="contained" color="error" disabled={!selectedId} onClick={() => { setActionType("Delete"); setDialogOpen(true); }}>
            Delete
          </Button>
        </div>

        {/* DATA GRID */}
        <div className="mt-10" style={{ height: 420 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.moodId}
            onRowClick={(params) => {
              setFormData(params.row);
              setSelectedId(params.row.moodId);
            }}
          />
        </div>

        {/* CONFIRMATION DIALOG */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Confirm {actionType}</DialogTitle>
          <DialogContent>
            Are you sure you want to {actionType} this record?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmAction}>OK</Button>
          </DialogActions>
        </Dialog>

      </div>
    </div>
  );
};

export default MoodForm;
