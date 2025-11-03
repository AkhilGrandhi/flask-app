import { useEffect, useState } from "react";
import {
  Container, Box, Typography, Button, Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, IconButton,
  Snackbar, CircularProgress, Tooltip, Grid, Alert,
  InputAdornment, Stack
} from "@mui/material";
import { 
  PlayArrow, Stop, Search, Refresh,
  Edit, Info as InfoIcon, Receipt
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../AuthContext";
import {
  listSubscriptions, createSubscription, activateSubscription,
  deactivateSubscription,
  updateSubscription, listAllCandidates
} from "../api";

import DashboardHeader from "../components/DashboardHeader";
import Footer from "../components/Footer";

export default function SubscriptionManagement() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [search, setSearch] = useState("");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    candidate_id: "",
    tier: "Silver",
    billing_cycle: "monthly",
    price: "50",
    notes: "",
    payment_method: "manual",
    transaction_id: "",
    expires_at: "",
    renewal_date: ""
  });
  
  // Notification
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // Loading states for actions (tracks candidateId and action type)
  const [actionLoading, setActionLoading] = useState({});
  
  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterTier !== "all") params.tier = filterTier;
      if (search) params.search = search;
      
      const data = await listSubscriptions(params);
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      setSnackbar({ open: true, message: error.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };
  
  const loadCandidates = async () => {
    try {
      const data = await listAllCandidates();
      setCandidates(data.candidates || []);
    } catch (error) {
      console.error("Error loading candidates:", error);
    }
  };
  
  useEffect(() => {
    loadSubscriptions();
  }, [filterStatus, filterTier, search]);
  
  useEffect(() => {
    if (createDialogOpen) {
      loadCandidates();
    }
  }, [createDialogOpen]);
  
  const handleCreate = async () => {
    try {
      await createSubscription(formData);
      setSnackbar({ open: true, message: "Subscription created successfully", severity: "success" });
      setCreateDialogOpen(false);
      resetForm();
      loadSubscriptions();
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
  };
  
  const handleActivate = async (candidateId) => {
    const key = `${candidateId}_activate`;
    try {
      setActionLoading(prev => ({ ...prev, [key]: true }));
      console.log(`Activating subscription for candidate ${candidateId}...`);
      await activateSubscription(candidateId);
      console.log(`Subscription activated successfully for candidate ${candidateId}`);
      setSnackbar({ open: true, message: "Subscription activated", severity: "success" });
      await loadSubscriptions();
    } catch (error) {
      console.error("Error activating subscription:", error);
      setSnackbar({ open: true, message: error.message || "Failed to activate subscription", severity: "error" });
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };
  
  const handleDeactivate = async (candidateId) => {
    if (!window.confirm("Are you sure you want to deactivate this subscription?")) {
      return;
    }
    const key = `${candidateId}_deactivate`;
    try {
      setActionLoading(prev => ({ ...prev, [key]: true }));
      console.log(`Deactivating subscription for candidate ${candidateId}...`);
      await deactivateSubscription(candidateId);
      console.log(`Subscription deactivated successfully for candidate ${candidateId}`);
      setSnackbar({ open: true, message: "Subscription deactivated", severity: "success" });
      await loadSubscriptions();
    } catch (error) {
      console.error("Error deactivating subscription:", error);
      setSnackbar({ open: true, message: error.message || "Failed to deactivate subscription", severity: "error" });
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };
  
  const handleEdit = (sub) => {
    setSelectedSub(sub);
    setFormData({
      candidate_id: "",
      tier: sub.tier,
      billing_cycle: sub.billing_cycle,
      price: sub.price?.toString() || "",
      notes: sub.notes || "",
      payment_method: sub.payment_method,
      transaction_id: sub.transaction_id || "",
      expires_at: sub.expires_at || "",
      renewal_date: sub.renewal_date || ""
    });
    setEditDialogOpen(true);
  };
  
  const handleUpdate = async () => {
    try {
      await updateSubscription(selectedSub.candidate_id, formData);
      setSnackbar({ open: true, message: "Subscription updated successfully", severity: "success" });
      setEditDialogOpen(false);
      setSelectedSub(null);
      resetForm();
      loadSubscriptions();
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: "error" });
    }
  };
  
  const resetForm = () => {
    setFormData({
      candidate_id: "",
      tier: "Silver",
      billing_cycle: "monthly",
      price: "50",
      notes: "",
      payment_method: "manual",
      transaction_id: "",
      expires_at: "",
      renewal_date: ""
    });
  };
  
  // Show all candidates - subscriptions can be managed for existing ones or created for new ones
  const availableCandidates = candidates;
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <DashboardHeader 
        user={user}
        logout={logout}
        title="Subscription Management"
        subtitle="Manage candidate subscriptions"
      />
      
      <Container maxWidth="xl" sx={{ mt: 2, mb: 2, flex: 1 }}>
        {/* Subscriptions Table */}
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
              💳 Candidate Subscriptions
            </Typography>
            
            {/* Filters */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, justifyContent: "flex-end" }}>
              <TextField
                size="small"
                placeholder="Search candidates..."
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
                  width: 180,
                  "& .MuiOutlinedInput-root": {
                    height: 32,
                    fontSize: "0.8rem"
                  }
                }}
              />
              
              <Select
                size="small"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                displayEmpty
                sx={{
                  bgcolor: "white",
                  borderRadius: 1,
                  width: 120,
                  height: 32,
                  fontSize: "0.8rem",
                  "& .MuiSelect-select": {
                    py: 0.5
                  }
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="deactivated">Deactivated</MenuItem>
              </Select>
              
              <Select
                size="small"
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                displayEmpty
                sx={{
                  bgcolor: "white",
                  borderRadius: 1,
                  width: 110,
                  height: 32,
                  fontSize: "0.8rem",
                  "& .MuiSelect-select": {
                    py: 0.5
                  }
                }}
              >
                <MenuItem value="all">All Tiers</MenuItem>
                <MenuItem value="Gold">Gold</MenuItem>
                <MenuItem value="Silver">Silver</MenuItem>
              </Select>
              
              <Button
                size="small"
                variant="contained"
                onClick={loadSubscriptions}
                startIcon={<Refresh />}
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
                Refresh
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ p: 2, pt: 1.5, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : subscriptions.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No subscriptions found
              </Typography>
            </Box>
          ) : subscriptions.length > 0 ? (
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
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Candidate</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Tier</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Billing Cycle</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Expires At</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Last Renewal Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Payment Method</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: "text.primary", py: 1.25, bgcolor: "grey.100", position: 'sticky', top: 0, zIndex: 1 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow 
                    key={sub.id}
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
                      <TableCell>
                        <Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: "primary.main",
                              mb: 0.25
                            }}
                          >
                            {sub.candidate?.first_name} {sub.candidate?.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sub.candidate?.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box 
                          component="span" 
                          sx={{ 
                            px: 1.5, 
                            py: 0.5, 
                            borderRadius: 1, 
                            bgcolor: sub.tier === "Gold" ? "warning.light" : "info.light",
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: 600
                          }}
                        >
                          {sub.tier}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box 
                          component="span" 
                          sx={{ 
                            px: 1.5, 
                            py: 0.5, 
                            borderRadius: 1, 
                            bgcolor: sub.status === "active" ? "success.light" : 
                                     sub.status === "expired" ? "error.light" : 
                                     sub.status === "deactivated" ? "grey.400" : "info.light",
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "capitalize"
                          }}
                        >
                          {sub.status}
                        </Box>
                      </TableCell>
                      <TableCell>{sub.billing_cycle}</TableCell>
                      <TableCell>${sub.price || "0.00"}</TableCell>
                      <TableCell>
                        {sub.candidate?.subscription_start_date 
                          ? new Date(sub.candidate.subscription_start_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {sub.expires_at 
                          ? new Date(sub.expires_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {sub.last_renewal_date 
                          ? new Date(sub.last_renewal_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Box 
                          component="span" 
                          sx={{ 
                            px: 1.5, 
                            py: 0.5, 
                            borderRadius: 1, 
                            bgcolor: "grey.200",
                            color: "text.primary",
                            fontSize: "0.75rem",
                            fontWeight: 600
                          }}
                        >
                          {sub.payment_method}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton 
                            size="small"
                            onClick={() => navigate(`/candidates/${sub.candidate_id}/transactions`)}
                            sx={{ 
                              color: "primary.main",
                              "&:hover": {
                                bgcolor: "primary.lighter"
                              }
                            }}
                            title="View Transactions"
                          >
                            <Receipt fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => handleEdit(sub)}
                            sx={{ 
                              color: "info.main",
                              "&:hover": {
                                bgcolor: "info.lighter"
                              }
                            }}
                            title="Edit Subscription"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          {(sub.status === "inactive" || sub.status === "deactivated" || sub.status === "expired") && (
                            <IconButton 
                              size="small"
                              onClick={() => handleActivate(sub.candidate_id)}
                              disabled={actionLoading[`${sub.candidate_id}_activate`]}
                              sx={{ 
                                color: "success.main",
                                "&:hover": {
                                  bgcolor: "success.lighter"
                                }
                              }}
                              title="Activate Subscription"
                            >
                              {actionLoading[`${sub.candidate_id}_activate`] ? (
                                <CircularProgress size={16} color="success" />
                              ) : (
                                <PlayArrow fontSize="small" />
                              )}
                            </IconButton>
                          )}
                          {sub.status !== "deactivated" && sub.status !== "expired" && sub.status !== "paused" && (
                            <IconButton 
                              size="small"
                              color="error"
                              onClick={() => handleDeactivate(sub.candidate_id)}
                              disabled={actionLoading[`${sub.candidate_id}_deactivate`]}
                              sx={{ 
                                "&:hover": {
                                  bgcolor: "error.lighter"
                                }
                              }}
                              title="Deactivate Subscription"
                            >
                              {actionLoading[`${sub.candidate_id}_deactivate`] ? (
                                <CircularProgress size={16} color="error" />
                              ) : (
                                <Stop fontSize="small" />
                              )}
                            </IconButton>
                          )}
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
                No subscriptions match your filters
              </Typography>
            </Box>
          )}
          </Box>
        </Paper>
      </Container>
      
      <Footer />
      
      {/* Create Subscription Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Subscription</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Select
              fullWidth
              value={formData.candidate_id}
              onChange={(e) => {
                const candidateId = e.target.value;
                const selectedCandidate = candidates.find(c => c.id === candidateId);
                
                if (selectedCandidate) {
                  // Auto-populate tier and start date from candidate
                  const tier = selectedCandidate.subscription_type || "Silver";
                  const defaultPrice = tier === "Gold" ? "150" : "50";
                  const startDate = selectedCandidate.subscription_start_date || "";
                  
                  // Calculate end date (30 days from start date) and renewal date (1 day after expiry)
                  let endDate = "";
                  let renewalDate = "";
                  if (startDate) {
                    const start = new Date(startDate);
                    const end = new Date(start);
                    end.setDate(end.getDate() + 30);
                    endDate = end.toISOString().split('T')[0];
                    
                    // Calculate renewal date as 1 day after expiry
                    const renewal = new Date(end);
                    renewal.setDate(renewal.getDate() + 1);
                    renewalDate = renewal.toISOString().split('T')[0];
                  }
                  
                  setFormData({
                    ...formData,
                    candidate_id: candidateId,
                    tier: tier,
                    price: defaultPrice,
                    expires_at: endDate,
                    renewal_date: renewalDate
                  });
                } else {
                  setFormData({ ...formData, candidate_id: candidateId });
                }
              }}
              displayEmpty
            >
              <MenuItem value="" disabled>Select Candidate</MenuItem>
              {availableCandidates.map((candidate) => (
                <MenuItem key={candidate.id} value={candidate.id}>
                  {candidate.first_name} {candidate.last_name} ({candidate.email}) - {candidate.subscription_type || 'No Subscription'}
                </MenuItem>
              ))}
            </Select>
            
            <Select
              fullWidth
              value={formData.tier}
              onChange={(e) => {
                const newTier = e.target.value;
                // Set default price based on tier
                const defaultPrice = newTier === "Gold" ? "150" : "50";
                setFormData({ ...formData, tier: newTier, price: defaultPrice });
              }}
              label="Tier"
            >
              <MenuItem value="Gold">Gold - $150</MenuItem>
              <MenuItem value="Silver">Silver - $50</MenuItem>
            </Select>
            
            <Select
              fullWidth
              value={formData.billing_cycle}
              onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
              label="Billing Cycle"
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
            
            <TextField
              fullWidth
              type="number"
              label="Price (USD)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
            
            <TextField
              fullWidth
              type="date"
              label="Expires At"
              value={formData.expires_at || ""}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Automatically set to 30 days from today, or based on candidate start date"
            />
            
            <TextField
              fullWidth
              type="date"
              label="Renewal Date"
              value={formData.renewal_date || ""}
              onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Automatically set to 1 day after expiry date"
            />
            
            <Select
              fullWidth
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              label="Payment Method"
            >
              <MenuItem value="manual">Manual</MenuItem>
              <MenuItem value="stripe">Stripe</MenuItem>
              <MenuItem value="paypal">PayPal</MenuItem>
              <MenuItem value="razorpay">Razorpay</MenuItem>
            </Select>
            
            <TextField
              fullWidth
              label="Transaction ID (Optional)"
              value={formData.transaction_id}
              onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
            disabled={!formData.candidate_id || !formData.price}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Subscription Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Subscription</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {selectedSub && (
              <Alert severity="info" sx={{ mb: 1 }}>
                Editing subscription for: {selectedSub.candidate?.first_name} {selectedSub.candidate?.last_name}
              </Alert>
            )}
            
            <Select
              fullWidth
              value={formData.tier}
              onChange={(e) => {
                const newTier = e.target.value;
                const defaultPrice = newTier === "Gold" ? "150" : "50";
                setFormData({ ...formData, tier: newTier, price: defaultPrice });
              }}
              label="Tier"
            >
              <MenuItem value="Gold">Gold - $150</MenuItem>
              <MenuItem value="Silver">Silver - $50</MenuItem>
            </Select>
            
            <Select
              fullWidth
              value={formData.billing_cycle}
              onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
              label="Billing Cycle"
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
            
            <TextField
              fullWidth
              type="number"
              label="Price (USD)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
            
            <TextField
              fullWidth
              type="date"
              label="Expires At"
              value={formData.expires_at ? (formData.expires_at.includes('T') ? formData.expires_at.slice(0,10) : formData.expires_at) : ""}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Change the expiration date if needed"
            />
            
            <TextField
              fullWidth
              type="date"
              label="Renewal Date"
              value={formData.renewal_date ? (formData.renewal_date.includes('T') ? formData.renewal_date.slice(0,10) : formData.renewal_date) : ""}
              onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Change the renewal date if needed"
            />
            
            <Select
              fullWidth
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              label="Payment Method"
            >
              <MenuItem value="manual">Manual</MenuItem>
              <MenuItem value="stripe">Stripe</MenuItem>
              <MenuItem value="paypal">PayPal</MenuItem>
              <MenuItem value="razorpay">Razorpay</MenuItem>
            </Select>
            
            <TextField
              fullWidth
              label="Transaction ID (Optional)"
              value={formData.transaction_id}
              onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditDialogOpen(false); setSelectedSub(null); resetForm(); }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdate}
            disabled={!formData.price}
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

