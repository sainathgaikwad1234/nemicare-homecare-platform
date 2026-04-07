import { useState, useEffect, useCallback } from 'react';
import { chartingService, ChartingType } from '../services/charting.service';

interface UseChartingDataOptions {
  residentId: number | undefined;
  type: ChartingType;
  sampleData?: any[];
}

export function useChartingData({ residentId, type, sampleData = [] }: UseChartingDataOptions) {
  const [data, setData] = useState<any[]>(sampleData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!residentId) return;
    setLoading(true);
    try {
      const res = await chartingService.list(residentId, type);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) setData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [residentId, type]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addRecord = async (record: any) => {
    if (!residentId) return null;
    try {
      const res = await chartingService.create(residentId, type, record);
      if (res.success) { setData((prev) => [res.data, ...prev]); return res.data; }
    } catch {
      const local = { ...record, id: Date.now() };
      setData((prev) => [local, ...prev]);
      return local;
    }
    return null;
  };

  const updateRecord = async (id: number, record: any) => {
    if (!residentId) return null;
    try {
      const res = await chartingService.update(residentId, type, id, record);
      if (res.success) { setData((prev) => prev.map((r) => (r.id === id ? res.data : r))); return res.data; }
    } catch {
      setData((prev) => prev.map((r) => (r.id === id ? { ...r, ...record } : r)));
    }
    return null;
  };

  const deleteRecord = async (id: number) => {
    if (!residentId) return;
    try { await chartingService.remove(residentId, type, id); } catch {}
    setData((prev) => prev.filter((r) => r.id !== id));
  };

  return { data, loading, error, fetchData, addRecord, updateRecord, deleteRecord, setData };
}
