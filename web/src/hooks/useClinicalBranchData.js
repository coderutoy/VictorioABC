import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

/**
 * Live clinical data hook for Admin, Nurse, and Doctor dashboards.
 * Talks directly to the Express / Vercel serverless `/api/v1/*` endpoints backed by
 * the 6 live Supabase PostgreSQL tables (`branches`, `profiles`, `patients`,
 * `clinical_cases`, `pep_doses`, `vaccine_inventory`).
 */
export function useClinicalBranchData(branchId = 'santa-maria', { isAdmin = false } = {}) {
  const resolvedBranchId = branchId || 'santa-maria';

  const [summary, setSummary] = useState({
    totalPatients: 0,
    totalCases: 0,
    activeCases: 0,
    nurseQueue: 0,
    doctorQueue: 0,
    completedCases: 0,
    todayDueDoses: 0,
    todayCompletedDoses: 0,
    missedDoses: 0,
    lowStockCount: 0,
    activeStaffCount: 0,
  });
  const [staff, setStaff] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [cases, setCases] = useState([]);
  const [doses, setDoses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const requests = [
        api.get('/dashboard/summary', { params: { branch_id: resolvedBranchId } }),
        api.get('/inventory', { params: { branch_id: resolvedBranchId } }),
        api.get('/cases', { params: { branch_id: resolvedBranchId } }),
        api.get('/doses', { params: { branch_id: resolvedBranchId } }),
        api.get('/patients', { params: { branch_id: resolvedBranchId } }),
      ];

      if (isAdmin) {
        requests.push(
          api.get('/admin/staff', { params: { branch_id: resolvedBranchId } }),
          api.get('/admin/staff', { params: { branch_id: 'all' } })
        );
      }

      const results = await Promise.all(requests);
      const [sumRes, invRes, casesRes, dosesRes, patRes, branchStaffRes, allStaffRes] = results;

      if (sumRes?.data?.summary) setSummary(sumRes.data.summary);
      setInventory(invRes?.data?.inventory || invRes?.data?.data || []);
      setCases(casesRes?.data?.cases || casesRes?.data?.data || []);
      setDoses(dosesRes?.data?.doses || dosesRes?.data?.data || []);
      setPatients(patRes?.data?.patients || patRes?.data?.data || []);

      if (isAdmin) {
        setStaff(branchStaffRes?.data?.staff || []);
        setAllStaff(allStaffRes?.data?.staff || []);
      }
    } catch (err) {
      setError(err.userMessage || err.message || 'Failed to load live branch data.');
    } finally {
      setLoading(false);
    }
  }, [resolvedBranchId, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Admin: Staff CRUD
  const createStaffAccount = async (payload) => {
    const res = await api.post('/admin/staff', {
      ...payload,
      branch_id: payload.role === 'admin' ? null : payload.branch_id || resolvedBranchId,
    });
    await loadData();
    return res.data?.staff || res.data?.data;
  };

  const updateStaffAccount = async (id, payload) => {
    const res = await api.patch(`/admin/staff/${id}`, payload);
    await loadData();
    return res.data?.staff || res.data?.data;
  };

  // Inventory CRUD
  const addInventoryBatch = async (payload) => {
    const res = await api.post('/inventory', {
      ...payload,
      branch_id: resolvedBranchId,
    });
    await loadData();
    return res.data?.item || res.data?.data;
  };

  const updateInventoryBatch = async (id, payload) => {
    const res = await api.patch(`/inventory/${id}`, payload);
    await loadData();
    return res.data?.item || res.data?.data;
  };

  const deleteInventoryBatch = async (id) => {
    await api.delete(`/inventory/${id}`);
    await loadData();
  };

  // Patients & Walk-In Intake CRUD
  const createWalkInPatient = async (payload) => {
    const res = await api.post('/patients', {
      ...payload,
      branch_id: resolvedBranchId,
    });
    await loadData();
    return res.data?.data || res.data;
  };

  const updatePatientInfo = async (id, payload) => {
    const res = await api.patch(`/patients/${id}`, payload);
    await loadData();
    return res.data?.patient || res.data?.data;
  };

  // Clinical Cases CRUD
  const createClinicalCase = async (payload) => {
    const res = await api.post('/cases', {
      ...payload,
      branch_id: resolvedBranchId,
    });
    await loadData();
    return res.data?.case || res.data?.data;
  };

  const updateClinicalCase = async (id, payload) => {
    const res = await api.patch(`/cases/${id}`, payload);
    await loadData();
    return res.data?.case || res.data?.data;
  };

  // PEP Doses CRUD
  const administerPepDose = async (id, payload) => {
    const res = await api.patch(`/doses/${id}/administer`, payload);
    await loadData();
    return res.data?.dose || res.data?.data;
  };

  const missOrReschedulePepDose = async (id, payload) => {
    const res = await api.patch(`/doses/${id}/miss`, payload);
    await loadData();
    return res.data?.dose || res.data?.data;
  };

  return {
    branchId: resolvedBranchId,
    summary,
    staff,
    allStaff,
    inventory,
    cases,
    doses,
    patients,
    loading,
    error,
    refresh: loadData,
    createStaffAccount,
    updateStaffAccount,
    addInventoryBatch,
    updateInventoryBatch,
    deleteInventoryBatch,
    createWalkInPatient,
    updatePatientInfo,
    createClinicalCase,
    updateClinicalCase,
    administerPepDose,
    missOrReschedulePepDose,
  };
}
