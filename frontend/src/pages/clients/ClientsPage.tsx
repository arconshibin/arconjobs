"use client";

import { useEffect, useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, useDisclosure } from "@heroui/react";
import { Icon } from "@iconify/react";
import PageCard from "../../components/PageCard";
import ClientTable from "../../components/clients/ClientTable";
import ClientForm from "../../components/clients/ClientForm";
import { getClients, Client, ClientStatus } from "../../services/clientService";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

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
    } else {
      toast(res.error || "Failed to load clients.", "danger");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);
    const actions = (
    <Button color="primary" className="text-white"  onPress={create.onOpen}>
      <Icon icon="lucide:plus" className="mr-1" />
      Add Client
    </Button>
  );

  return (
    <div className="p-4 md:p-6">
      <PageCard title="Clients" actions={actions} >
        {/* toast (same style you already use) */}
        {toastMsg && (
          <div
            className={`rounded-md p-3 text-sm ${
              toastMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {toastMsg.text}
          </div>
        )}

        <ClientTable
          clients={clients}
          loading={loading}
          onSearch={(filters) => load(filters)}
          onEdit={(client) => {
            setEditing(client);
            edit.onOpen();
          }}
        />
      </PageCard>

      {/* Create modal (unchanged content) */}
      <Modal isOpen={create.isOpen} onOpenChange={create.onOpenChange} placement="center" size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Add Client</ModalHeader>
              <ModalBody>
                <ClientForm
                  onSuccess={(c) => {
                    setClients((prev) => [c, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
                    onClose();
                  }}
                  onClose={onClose}
                  toast={toast}
                  buttonLabel="Create"
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Close</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit modal (unchanged content) */}
      <Modal isOpen={!!editing} onOpenChange={(open) => !open && setEditing(null)} placement="center" size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Edit: {editing?.name}</ModalHeader>
              <ModalBody>
                {editing && (
                  <ClientForm
                    initial={editing}
                    onSuccess={(updated) => {
                      setClients((prev) =>
                        prev.map((x) => (x.id === updated.id ? updated : x)).sort((a, b) => a.name.localeCompare(b.name))
                      );
                      onClose();
                    }}
                    onClose={() => {
                      setEditing(null);
                      onClose();
                    }}
                    toast={toast}
                    buttonLabel="Update"
                  />
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Close</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
