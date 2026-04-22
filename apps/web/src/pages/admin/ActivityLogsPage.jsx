
import React, { useState, useEffect } from 'react';
import api from '@/lib/api.js';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import {
  Empty,
  EMPTY_STATE_VARIANTS,
} from '@/components/ui/empty.jsx';
import { Search, RefreshCcw, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import SectionHeader from '@/components/SectionHeader.jsx';

const extractLogs = (payload) => {
  if (Array.isArray(payload?.logs)) return payload.logs;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const safeFormatDate = (value, pattern = 'dd/MM/yyyy HH:mm:ss') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern);
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/settings/activity-logs', {
        params: {
          page: 1,
          perPage: 50,
          action_type: actionFilter !== 'all' ? actionFilter.toLowerCase() : undefined
        }
      });
      
      let items = extractLogs(data);
      if (resourceFilter !== 'all') {
        items = items.filter((l) => l.target_type === resourceFilter);
      }
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        items = items.filter(l => 
          (l.admin_name || '').toLowerCase().includes(lower) || 
          JSON.stringify(l.details || {}).toLowerCase().includes(lower)
        );
      }
      setLogs(items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [actionFilter, resourceFilter, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Log Aktivitas"
        subtitle="Audit trail tindakan sistem dari backend MySQL Edition."
      />

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="p-4 bg-muted/50 border-b flex flex-wrap gap-4">
          <div className="relative w-full sm:w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari detail..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[140px] bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              <SelectItem value="Create">Create</SelectItem>
              <SelectItem value="Update">Update</SelectItem>
              <SelectItem value="Delete">Delete</SelectItem>
            </SelectContent>
          </Select>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-[140px] bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Resource</SelectItem>
              <SelectItem value="Tiket">Tiket</SelectItem>
              <SelectItem value="User">User</SelectItem>
              <SelectItem value="Teknisi">Teknisi</SelectItem>
              <SelectItem value="Chat">Chat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="px-6 w-[160px]">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Detail JSON</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length > 0 ? (
                  logs.map((l) => (
                    <TableRow key={l.id} className="hover:bg-muted/30">
                      <TableCell className="px-6 text-xs text-muted-foreground font-mono">{safeFormatDate(l.created_at || l.created)}</TableCell>
                      <TableCell className="font-medium text-sm">{l.admin_name || 'System'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          l.action_type === 'Create' ? 'text-green-600 border-green-200 bg-green-50' :
                          l.action_type === 'Update' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                          'text-destructive border-destructive/20 bg-destructive/10'
                        }>{l.action_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{l.target_type}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground max-w-[300px] truncate" title={JSON.stringify(l.details)}>
                        {JSON.stringify(l.details)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-56">
                      <Empty
                        className="border-0 shadow-none"
                        variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                        title="Tidak ada log aktivitas"
                        description="Belum ada aktivitas yang cocok dengan filter saat ini."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
