// frontend/src/App.tsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Typography,
  TextField,
  Checkbox,
  FormGroup,
  FormControlLabel,
  CircularProgress,
  TableHead,
  Table,
  TableContainer,
  Paper,
  Button,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
} from '@mui/material';

interface Listing {
  pricePerUnit: number;
  quantity: number;
  worldName: string;
}

interface Materia {
  id: number;
  name: string;
  stat: string;
  stat_increase: number;
  average_gil: number;
  scrip_cost: number;
  scrip_type: string;
  advanced_melding: boolean;
  total_quantity: number;
  listing_count: number;
  cheapest_listings: Listing[];
  color: string;
  highlighted: boolean;
  historical_avg: number;
}

const App: React.FC = () => {
  const [materia, setMateria] = useState<Materia[]>([]);
  const [world, setWorld] = useState('Aether');
  const [sortKey, setSortKey] = useState('average_gil');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStats, setSelectedStats] = useState<string[]>([]);
  const [allStats, setAllStats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [timingOpen, setTimingOpen] = useState(false);
  const [timing, setTiming] = useState<Record<string, any>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [highlightPct, setHighlightPct] = useState(105);

  useEffect(() => {
    setLoading(true);
    axios.get(`/materia?world=${world}`).then((res) => {
      setMateria(res.data);
      setLoading(false);
    });
  }, [world]);

  useEffect(() => {
    const allUniqueStats = Array.from(new Set(materia.map(m => m.stat)));
    setAllStats(allUniqueStats);
    if (selectedStats.length === 0) {
      setSelectedStats(allUniqueStats.filter((s: string) => ["CP", "Control", "Craftsmanship"].includes(s)));
    }
  }, [materia]);

  useEffect(() => {
    if (timingOpen) {
      axios.get('/debug/timing').then((res) => setTiming(res.data));
    }
  }, [timingOpen]);

  const toggleStat = (stat: string) => {
    setSelectedStats((prev) =>
      prev.includes(stat) ? prev.filter((s) => s !== stat) : [...prev, stat]
    );
  };

  const statColorMap = materia.reduce((acc, m) => {
    acc[m.stat] = m.color;
    return acc;
  }, {} as Record<string, string>);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleRowClick = (item: number) => {
    window.open(`https://universalis.app/market/${item.toString()}`, '_blank');
  };

  const statColumns = selectedStats.map((stat) => {
    const filtered = materia
      .filter((m) => m.stat === stat)
      .sort((a, b) => {
        const direction = sortOrder === 'asc' ? 1 : -1;
        const valA = (a as any)[sortKey] ?? (sortKey === 'name' ? '' : 0);
        const valB = (b as any)[sortKey] ?? (sortKey === 'name' ? '' : 0);
        return valA > valB ? direction : valA < valB ? -direction : 0;
      });

    return (
      <div key={stat} style={{ width: '100%' }}>
        <Typography
          variant="h6"
          gutterBottom
          style={{ color: statColorMap[stat]?.toLowerCase() }}
        >
          {stat}
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name</TableCell>
                <TableCell onClick={() => handleSort('stat_increase')} style={{ cursor: 'pointer' }}>+Stat</TableCell>
                <TableCell onClick={() => handleSort('average_gil')} style={{ cursor: 'pointer' }}>Avg Price</TableCell>
                <TableCell>Scrip Cost</TableCell>
                <TableCell onClick={() => handleSort('cheapest_listings')} style={{ cursor: 'pointer' }}>Cheapest</TableCell>
                <TableCell onClick={() => handleSort('total_quantity')} style={{ cursor: 'pointer' }}>Quantity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((m) => (
                <Tooltip
                  key={m.id}
                  arrow
                  placement="top"
                  title={
                    <div>
                      {m.cheapest_listings?.map((l, i) => (
                        <Typography variant="body2" key={i}>
                          {l.quantity} × {l.pricePerUnit.toLocaleString()} gil @ {l.worldName}
                        </Typography>
                      ))}
                    </div>
                  }
                >
                  <TableRow 
                    className={`table-row ${m.historical_avg && m.average_gil <= m.historical_avg * (highlightPct / 100) ? 'highlighted' : ''}`}
                    onClick={() => handleRowClick(m.id)}
                    style={{ cursor: 'pointer' }}>
                    <TableCell style={{ color: m.color.toLowerCase() }}>{m.name}</TableCell>
                    <TableCell>{m.stat_increase}</TableCell>
                    <TableCell>{m.average_gil?.toLocaleString() ?? 'N/A'}</TableCell>
                    <TableCell style={{ color: m.scrip_type === 'orange' ? 'darkorange' : m.scrip_type === 'purple' ? 'mediumpurple' : undefined }}>
                      {m.scrip_cost ?? '—'}
                    </TableCell>
                    <TableCell>{(m.cheapest_listings[0].pricePerUnit).toLocaleString() ?? 0}</TableCell>
                    <TableCell>{m.total_quantity ?? 0}</TableCell>
                  </TableRow>
                </Tooltip>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  });

  return (
    <div style={{ padding: '1rem' }}>
      <Typography variant="h4" gutterBottom>Materia Market Dashboard</Typography>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <TextField
          label="World"
          value={world}
          onChange={(e) => setWorld(e.target.value)}
        />
        <Button onClick={() => setTimingOpen(true)} variant="outlined">Show Timing Info</Button>
        <Button onClick={() => setSettingsOpen(true)} variant="outlined">Settings</Button>
      </div>

      <FormGroup row style={{ marginBottom: '1rem' }}>
        {allStats.map((stat) => (
          <FormControlLabel
            key={stat}
            control={
              <Checkbox
                checked={selectedStats.includes(stat)}
                onChange={() => toggleStat(stat)}
              />
            }
            label={stat}
          />
        ))}
      </FormGroup>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <CircularProgress />
          <Typography variant="body1">Loading materia data...</Typography>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {statColumns}
        </div>
      )}

      <Drawer anchor="right" open={timingOpen} onClose={() => setTimingOpen(false)}>
        <div style={{ padding: '1rem', width: '300px' }}>
          <Typography variant="h6">API Timing</Typography>
          {Object.entries(timing).map(([k, v]) => (
            <Typography key={k} variant="body2">
              <strong>{k}:</strong> {v.calls} calls, avg {v.avg_time.toFixed(2)}s, total {v.total_time.toFixed(2)}s
            </Typography>
          ))}
        </div>
      </Drawer>

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Highlight if Gil price is at or below % of historical average (over 100 means current is more than historical):
          </Typography>
          <Slider
            value={highlightPct}
            onChange={(_, val) => setHighlightPct(val as number)}
            valueLabelDisplay="auto"
            step={1}
            marks
            min={80}
            max={120}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default App;
