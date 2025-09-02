"use client";

import { useEffect, useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, useDisclosure } from "@heroui/react";
import { Icon } from "@iconify/react";
import PageCard from "../../components/PageCard";
import ClientTable from "../../components/clients/ClientTable";
import ClientForm from "../../components/clients/ClientForm";
import ClientModal from "../../components/clients/ClientModal";
import { getClients, Client, ClientStatus } from "../../services/clientService";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // toast (kept visually in the same place — above the table content)
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "danger" } | null>(null);
  const toast = (text: string, type: "success" | "danger" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 2800);
  };

  // create/edit modals
  const create = useDisclosure();
  const edit = useDisclosure();
  const [editing, setEditing] = useState<Client | null>(null);

  async function load(params?: { q?: string; status?: ClientStatus | "" }) {
    setLoading(true);
    const res = await getClients({
      q: params?.q?.trim(),
      status: (params?.status || undefined) as ClientStatus | undefined,
      ordering: "-created_at",
    });
    if (res.success) {
      const raw: any = res.returnedData;
      const rows: Client[] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];
      setClients(rows);
      setErr(null);
    } else {
      setErr(res.error || "Failed to load clients.");
      toast(res.error || "Failed to load clients.", "danger");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);
  const actions = (
    <Button color="primary" className="text-white" onPress={create.onOpen}>
      <Icon icon="lucide:plus" className="mr-1" />
      Add Client
    </Button>
  );

  return (
    <div className="p-2 sm:p-4 md:p-6 h-screen overflow-auto">
      <PageCard title="Clients" actions={actions}>
        {/* Toast and error messages */}
        {toastMsg && (
          <div
            aria-live="polite"
            className={`rounded-md p-3 text-sm mb-2 ${
              toastMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {toastMsg.text}
          </div>
        )}
        {err && (
          <div className="rounded-md p-3 text-sm mb-2 bg-red-50 text-red-700" aria-live="polite">
            {err}
          </div>
        )}

        {/* Responsive table wrapper */}
        <div className="overflow-x-auto w-full">
          <ClientTable
            clients={clients}
            loading={loading}
            onSearch={(filters) => load(filters)}
            onEdit={(client) => {
              setEditing(client);
              edit.onOpen();
            }}
          />
        </div>
      </PageCard>

      {/* Reusable Create modal */}
      <ClientModal
        isOpen={create.isOpen}
        onClose={create.onClose}
        title="Add Client"
      >
        <ClientForm
          onSuccess={(c) => {
            setClients((prev) => [c, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
            create.onClose();
          }}
          onClose={create.onClose}
          toast={toast}
          buttonLabel="Create"
        />
      </ClientModal>

      {/* Reusable Edit modal */}
      <ClientModal
        isOpen={!!editing}
        onClose={() => {
          setEditing(null);
          edit.onClose();
        }}
        title={editing ? `Edit: ${editing.name}` : "Edit Client"}
      >
        {editing && (
          <ClientForm
            initial={editing}
            onSuccess={(updated) => {
              setClients((prev) =>
                prev.map((x) => (x.id === updated.id ? updated : x)).sort((a, b) => a.name.localeCompare(b.name))
              );
              edit.onClose();
              setEditing(null);
            }}
            onClose={() => {
              setEditing(null);
              edit.onClose();
            }}
            toast={toast}
            buttonLabel="Update"
          />
        )}
      </ClientModal>
    </div>
  );
}
