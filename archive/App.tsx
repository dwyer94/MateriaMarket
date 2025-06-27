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
} from '@mui/material';

// Types to represent Universalis listings and full Materia data from the backend
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
  gil_price: number;
  scrip_cost: number;
  scrip_type: string;
  advanced_melding: boolean;
  total_quantity: number;
  listing_count: number;
  cheapest_listings: Listing[];
  color: string;
}

const App: React.FC = () => {
  const [materia, setMateria] = useState<Materia[]>([]);
  const [world, setWorld] = useState('Aether');
  const [sortKey, setSortKey] = useState('gil_price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStats, setSelectedStats] = useState<string[]>([]);
  const [allStats, setAllStats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch full materia data for selected world
  useEffect(() => {
    setLoading(true);
    axios.get(`/materia?world=${world}`).then((res) => {
      setMateria(res.data);
      setLoading(false);
    });
  }, [world]);

  // Extract unique stats from fetched materia and preselect common crafting ones
  useEffect(() => {
    const allUniqueStats = Array.from(new Set(materia.map(m => m.stat)));
    setAllStats(allUniqueStats);
    if (selectedStats.length === 0) {
      setSelectedStats(allUniqueStats.filter((s: string) =>
        ["CP", "Control", "Craftsmanship"].includes(s)
      ));
    }
  }, [materia]);

  const toggleStat = (stat: string) => {
    setSelectedStats((prev) =>
      prev.includes(stat) ? prev.filter((s) => s !== stat) : [...prev, stat]
    );
  };

  // Create stat-to-color lookup map for styling
  const statColorMap = materia.reduce((acc, m) => {
    acc[m.stat] = m.color;
    return acc;
  }, {} as Record<string, string>);

  // Sort column when user clicks table header
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Render each selected stat's materia in a separate table
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
                <TableCell onClick={() => handleSort('stat_increase')} style={{ cursor: 'pointer' }}>Stat Increase</TableCell>
                <TableCell onClick={() => handleSort('gil_price')} style={{ cursor: 'pointer' }}>Gil Price</TableCell>
                <TableCell>Scrip Cost</TableCell>
                <TableCell onClick={() => handleSort('listing_count')} style={{ cursor: 'pointer' }}>Listings</TableCell>
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
                  <TableRow hover>
                    <TableCell style={{ color: m.color.toLowerCase() }}>{m.name}</TableCell>
                    <TableCell>{m.stat_increase}</TableCell>
                    <TableCell>{m.gil_price?.toLocaleString() ?? 'N/A'}</TableCell>
                    <TableCell style={{ color: m.scrip_type === 'orange' ? 'darkorange' : m.scrip_type === 'purple' ? 'purple' : undefined }}>
                      {m.scrip_cost ?? '—'}
                    </TableCell>
                    <TableCell>{m.listing_count ?? 0}</TableCell>
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

      {/* World selector input */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <TextField
          label="World"
          value={world}
          onChange={(e) => setWorld(e.target.value)}
        />
      </div>

      {/* Stat filters */}
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

      {/* Loading spinner or content */}
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
    </div>
  );
};

export default App;
