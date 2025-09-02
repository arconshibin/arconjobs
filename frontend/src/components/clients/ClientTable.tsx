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

const STATUS_OPTIONS: { key: ClientStatus | ""; label: string }[] = [
  { key: "", label: "All" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
  { key: "archived", label: "Archived" },
];

// Table columns config
const TABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "contact", label: "Contact" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
  { key: "phone", label: "Phone" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", align: "text-right" },
];

export default function ClientTable({
  clients,
  loading,
  onSearch,
  onEdit,
}: {
  clients: Client[];
  loading: boolean;
  onSearch: (filters: { q: string; status: ClientStatus | "" }) => void;
  onEdit: (client: Client) => void;
}) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ClientStatus | "">("");
  const selectedStatusKeys = useMemo(
    () => (status ? new Set<string>([status]) : new Set<string>([""])),
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

  // Helper to get cell value by column key
  function getCellValue(client: Client, colKey: string) {
    switch (colKey) {
      case "name":
        return <span className="font-medium">{client.name}</span>;
      case "contact":
        return client.contact_user
          ? `${client.contact_user.first_name || ""} ${client.contact_user.last_name || ""}`.trim() ||
            client.contact_user.username
          : "—";
      case "email":
        return client.contact_user?.email || "—";
      case "address":
        return client.address || "—";
      case "phone":
        return client.phone || "—";
      case "status":
        return (
          <Chip
            size="sm"
            variant="flat"
            color={STATUS_COLORS[client.status] || "default"}
            className="capitalize"
          >
            {client.status}
          </Chip>
        );
      case "actions":
        return (
          <Button size="sm" variant="flat" onPress={() => onEdit(client)}>
            <Icon icon="lucide:edit" className="mr-1" /> Edit
          </Button>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-4">
      {/* Responsive toolbar */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <Input
          size="sm"
          placeholder="Search by name…"
          value={query}
          onValueChange={setQuery}
          startContent={<Icon icon="lucide:search" />}
          onKeyDown={(e) => e.key === "Enter" && onSearch({ q: query, status })}
          className="w-full md:w-72"
        />
        <Select
          size="sm"
          selectedKeys={selectedStatusKeys}
          className="w-full md:w-48"
          popoverProps={{ className: "min-w-[8rem]" }}
          selectorButtonProps={{
            className: "h-[2.25rem] min-h-[2.25rem] px-3",
          }}
          renderValue={() => {
            const selected = STATUS_OPTIONS.find(opt => opt.key === status);
            return selected ? selected.label : "All";
          }}
          onSelectionChange={(keys) => {
            const first = Array.from(keys)[0] as string | undefined;
            setStatus((first as ClientStatus) ?? "");
          }}
        >
          {STATUS_OPTIONS.map(opt => (
            <SelectItem key={opt.key}>{opt.label}</SelectItem>
          ))}
        </Select>
        <Button
          size="sm"
          onPress={() => onSearch({ q: query, status })}
          isLoading={loading}
          className="w-full md:w-auto"
        >
          Apply
        </Button>
      </div>

      {/* Table */}
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
          {TABLE_COLUMNS.map(col => (
            <TableColumn key={col.key} className={col.align || ""}>
              {col.label}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent={loading ? "Loading…" : "No clients found"}>
          {filtered.map((client) => (
            <TableRow key={client.id}>
              {TABLE_COLUMNS.map(col => (
                <TableCell key={col.key} className={col.align || ""}>
                  {getCellValue(client, col.key)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
