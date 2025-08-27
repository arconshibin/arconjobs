"use client";

import { useMemo, useState } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Input, Button, Chip, Select, SelectItem
} from "@heroui/react";
import type { Selection } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { Client, ClientStatus } from "../../services/clientService";

const STATUS_COLORS: Record<ClientStatus, "success" | "warning" | "default"> = {
  active: "success",
  suspended: "warning",
  archived: "default",
};

export default function ClientTable({
  clients,
  loading,
  onSearch,
  onCreateRequested,
  onEdit,
}: {
  clients: Client[];
  loading: boolean;
  onSearch: (filters: { q: string; status: ClientStatus | "" }) => void;
  onCreateRequested: () => void;
  onEdit: (client: Client) => void;
}) {
  const navigate = useNavigate();

  // keep your existing local UI state for filters & selection
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ClientStatus | "">("");
  const selectedStatusKeys = useMemo(
    () => (status ? new Set<string>([status]) : new Set<string>()),
    [status]
  );

  const [tableSelectedKeys, setTableSelectedKeys] = useState<Selection>(new Set([]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      const matchesText = !q || (c.name || "").toLowerCase().includes(q);
      const matchesStatus = !status || c.status === status;
      return matchesText && matchesStatus;
    });
  }, [clients, query, status]);

  return (
    <div className="space-y-4">
      {/* toolbar (unchanged) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by name…"
            value={query}
            onValueChange={setQuery}
            startContent={<Icon icon="lucide:search" />}
            onKeyDown={(e) => e.key === "Enter" && onSearch({ q: query, status })}
            className="w-72"
          />
          <Select
            label="Status"
            selectedKeys={selectedStatusKeys}
            className="w-48"
            onSelectionChange={(keys) => {
              const first = Array.from(keys)[0] as string | undefined;
              setStatus((first as ClientStatus) ?? "");
            }}
          >
            <SelectItem key="">All</SelectItem>
            <SelectItem key="active">Active</SelectItem>
            <SelectItem key="suspended">Suspended</SelectItem>
            <SelectItem key="archived">Archived</SelectItem>
          </Select>
          <Button onPress={() => onSearch({ q: query, status })} isLoading={loading}>
            Apply
          </Button>
        </div>

        
      </div>

      {/* table (unchanged) */}
      <Table
        aria-label="Clients table"
        isStriped
        removeWrapper
        selectionMode="single"
        selectedKeys={tableSelectedKeys}
        onSelectionChange={setTableSelectedKeys}
        onRowAction={(key) => navigate(`/clients/${key}`)}
      >
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Contact</TableColumn>
          <TableColumn>Email</TableColumn>
          <TableColumn>Address</TableColumn>
          <TableColumn>Phone</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn className="text-right">Actions</TableColumn>
        </TableHeader>
        <TableBody emptyContent={loading ? "Loading…" : "No clients found"}>
          {filtered.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>
                {c.contact_user
                  ? `${c.contact_user.first_name || ""} ${c.contact_user.last_name || ""}`.trim() ||
                    c.contact_user.username
                  : "—"}
              </TableCell>
              <TableCell>{c.contact_user?.email || "—"}</TableCell>
              <TableCell>{c.address || "—"}</TableCell>
              <TableCell>{c.phone || "—"}</TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" color={STATUS_COLORS[c.status] || "default"} className="capitalize">
                  {c.status}
                </Chip>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="flat" onPress={() => onEdit(c)}>
                  <Icon icon="lucide:edit" className="mr-1" /> Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
