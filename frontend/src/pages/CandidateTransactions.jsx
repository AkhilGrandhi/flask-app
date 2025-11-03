import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container, Box, Typography, Button, Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton,
  Snackbar, CircularProgress, Tooltip, Grid, Alert,
  InputAdornment, Stack
} from "@mui/material";
import { 
  Add, Edit, Delete, ArrowBack, Search, Refresh
} from "@mui/icons-material";

import { useAuth } from "../AuthContext";
import {
  listCandidateTransactions, createTransaction,
  updateTransaction, deleteTransaction
} from "../api";

import DashboardHeader from "../components/DashboardHeader";
import Footer from "../components/Footer";

export default function CandidateTransactions() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { candidateId } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    start_date: "",
    original_transaction: ""
  });
  
  // Notification
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // Loading states for actions
  const [actionLoading, setActionLoading] = useState({});
  
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await listCandidateTransactions(candidateId);
      setTransactions(data.transactions || []);
      setCandidate(data.candidate || null);
    } catch (error) {
      console.error("Error loading transactions:", error);
      setSnackbar({ open: true, message: error.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (candidateId) {
      loadTransactions();
    }
  }, [candidateId]);
  
  const handleCreate = async () => {
    try {
      await createTransaction(candidateId, formData);
      setSnackbar({ open: true, message: "Transaction created successfully", severity: "success" });
      setCreateDialogOpen(false);
      resetForm();
      loadTransactions();
    } catch (error) {
      console.error("Error creating transaction:", error);
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
  };
  
  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      start_date: transaction.start_date ? transaction.start_date.slice(0,10) : "",
      original_transaction: transaction.original_transaction || ""
    });
    setEditDialogOpen(true);
  };
  
  const handleUpdate = async () => {
    try {
      await updateTransaction(selectedTransaction.id, formData);
      setSnackbar({ open: true, message: "Transaction updated successfully", severity: "success" });
      setEditDialogOpen(false);
      setSelectedTransaction(null);
      resetForm();
      loadTransactions();
    } catch (error) {
      console.error("Error updating transaction:", error);
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
  };
  
  const handleDelete = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    const key = `delete_${transactionId}`;
    try {
      setActionLoading(prev => ({ ...prev, [key]: true }));
      await deleteTransaction(transactionId);
      setSnackbar({ open: true, message: "Transaction deleted successfully", severity: "success" });
      loadTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setSnackbar({ open: true, message: error.message, severity: "error" });
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };
  
  const resetForm = () => {
    setFormData({
      start_date: "",
      original_transaction: ""
    });
  };
  
  // Filter transactions by search
  const filteredTransactions = transactions.filter(t => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      t.transaction_id?.toLowerCase().includes(searchLower) ||
      t.original_transaction?.toLowerCase().includes(searchLower)
    );
  });
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <DashboardHeader 
        user={user}
        logout={logout}
        title={candidate ? `Transactions - ${candidate.first_name} ${candidate.last_name}` : "Transactions"}
        subtitle={candidate ? `Email: ${candidate.email}` : "Monthly transaction records"}
      />
      
      <Container maxWidth="xl" sx={{ mt: 2, mb: 2, flex: 1 }}>
        {/* Transactions Table */}
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Header with Filters */}
          <Box sx={{ 
            px: 2,
            py: 1, 
            bgcolor: "primary.main",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexShrink: 0
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
              💰 Transactions
            </Typography>
            
            {/* Filters and Actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, justifyContent: "flex-end" }}>
              <TextField
                size="small"
                placeholder="Search by Transaction ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  bgcolor: "white",
                  borderRadius: 1,
                  width: 250,
                  "& .MuiOutlinedInput-root": {
                    height: 32,
                    fontSize: "0.8rem"
                  }
                }}
              />
              
              <Button
                size="small"
                variant="contained"
                onClick={() => navigate(-1)}
                startIcon={<ArrowBack />}
                sx={{ 
                  height: 32,
                  bgcolor: "white",
                  color: "primary.main",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  px: 1.5,
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.9)"
                  }
                }}
              >
                Back
              </Button>
              
              <Button
                size="small"
                variant="contained"
                onClick={() => setCreateDialogOpen(true)}
                startIcon={<Add />}
                sx={{ 
                  height: 32,
                  bgcolor: "white",
                  color: "primary.main",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  px: 1.5,
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.9)"
                  }
                }}
              >
                Add Transaction
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ p: 2, pt: 1.5, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredTransactions.length > 0 ? (
            <Box sx={{ 
              maxHeight: 'calc(100vh - 270px)', 
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              '&': {
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }
            }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.100" }}>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Transaction ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Original Transaction</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Created At</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id}
                    hover
                    sx={{ 
                      "&:hover": { 
                        bgcolor: "primary.lighter",
                        cursor: "pointer"
                      },
                      transition: "all 0.2s",
                      "& td": { py: 1 }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                      {transaction.transaction_id}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {transaction.original_transaction || "N/A"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {transaction.start_date 
                        ? new Date(transaction.start_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                        : "N/A"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {transaction.end_date 
                        ? new Date(transaction.end_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                        : "N/A"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {transaction.created_at 
                        ? new Date(transaction.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                        : "N/A"}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton 
                          size="small"
                          onClick={() => handleEdit(transaction)}
                          sx={{ 
                            color: "info.main",
                            "&:hover": {
                              bgcolor: "info.lighter"
                            }
                          }}
                          title="Edit Transaction"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => handleDelete(transaction.id)}
                          disabled={actionLoading[`delete_${transaction.id}`]}
                          sx={{ 
                            "&:hover": {
                              bgcolor: "error.lighter"
                            }
                          }}
                          title="Delete Transaction"
                        >
                          {actionLoading[`delete_${transaction.id}`] ? (
                            <CircularProgress size={16} color="error" />
                          ) : (
                            <Delete fontSize="small" />
                          )}
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {search ? "No transactions found matching your search" : "No transactions found"}
              </Typography>
            </Box>
          )}
          </Box>
        </Paper>
      </Container>
      
      <Footer />
      
      {/* Create Transaction Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Transaction</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Transaction ID will be auto-generated. End Date will be automatically calculated as Start Date + 30 days.
            </Alert>
            
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              InputLabelProps={{ shrink: true }}
              helperText="Required - End Date will be automatically calculated as Start Date + 30 days"
            />
            
            <TextField
              fullWidth
              label="Original Transaction (Optional)"
              value={formData.original_transaction}
              onChange={(e) => setFormData({ ...formData, original_transaction: e.target.value })}
              helperText="Optional reference to original transaction"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreate}
            disabled={!formData.start_date}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Transaction Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Transaction</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {selectedTransaction && (
              <Alert severity="info" sx={{ mb: 1 }}>
                Transaction ID: {selectedTransaction.transaction_id}
                <br />
                End Date: {selectedTransaction.end_date 
                  ? new Date(selectedTransaction.end_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                  : "N/A"} (auto-calculated)
              </Alert>
            )}
            
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              InputLabelProps={{ shrink: true }}
              helperText="End Date will be automatically recalculated as Start Date + 30 days"
            />
            
            <TextField
              fullWidth
              label="Original Transaction (Optional)"
              value={formData.original_transaction}
              onChange={(e) => setFormData({ ...formData, original_transaction: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditDialogOpen(false); setSelectedTransaction(null); resetForm(); }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdate}
            disabled={!formData.start_date}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

