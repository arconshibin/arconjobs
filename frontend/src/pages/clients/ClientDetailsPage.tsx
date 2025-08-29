// src/pages/ClientDetailsPage.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
  Skeleton,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import PageCard from "../../components/PageCard";
import ClientForm from "../../components/clients/ClientForm";
import {
  Client,
  getClient,
  // updateClient is not used directly here
  deleteClient,
  resetContactPassword,
} from "../../services/clientService";
import { useAuth } from "../../context/AuthContext";
export default function ClientDetailsPage() {
  const { user } = useAuth();
  console.log(user)           // 👈 current logged-in user
  const canDelete = !!user?.is_superuser;
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [tempPwd, setTempPwd] = useState<string | null>(null);
  const [customPwd, setCustomPwd] = useState<string>("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [delBusy, setDelBusy] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    const res = await getClient(id);
    if (res.success) setClient(res.returnedData);
    else setErr(res.error || "Failed to load client");
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const contactName = useMemo(() => {
    if (!client?.contact_user) return "—";
    const { first_name, last_name, username } = client.contact_user;
    const full = `${first_name || ""} ${last_name || ""}`.trim();
    return full || username || "—";
  }, [client]);

  // --- Loading / Error states ------------------------------------------------
  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <PageCard
          title={
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-40 rounded-lg" />
            </div>
          }
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-20 rounded-lg" />
              <Skeleton className="h-6 w-24 rounded-lg" />
              <Divider className="my-2" />
              <Skeleton className="h-4 w-56 rounded-lg" />
              <Skeleton className="h-4 w-64 rounded-lg" />
              <Skeleton className="h-4 w-40 rounded-lg" />
              <Skeleton className="h-4 w-44 rounded-lg" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-28 rounded-lg" />
              <Skeleton className="h-5 w-48 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-lg" />
              <Skeleton className="h-5 w-60 rounded-lg" />
            </div>
          </div>
        </PageCard>
      </div >
    );
  }

  if (err || !client) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger">
          <div className="font-semibold mb-1">Couldn't load client</div>
          <div className="text-sm opacity-80">{err || "Not found"}</div>
          <div className="mt-3">
            <Button as={Link} to="/clients" variant="flat" startContent={<Icon icon="lucide:arrow-left" />}>
              Back to Clients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusColor =
    client.status === "active" ? "success" : client.status === "suspended" ? "warning" : "default";

  // --- Helpers ---------------------------------------------------------------
  async function handleDelete() {
    if (!client) return;
    setDelBusy(true);
    const res = await deleteClient(client.id);
    setDelBusy(false);
    if (res.success) {
      navigate("/clients", { replace: true });
    }
  }

  async function handleGenerateTemp() {
    if (!client) return;
    setPwdBusy(true);
    try {
      const res = await resetContactPassword(
        client.id,
        customPwd ? { password: customPwd } : undefined
      );
      if (res.success) {
        setTempPwd(res.returnedData.temp_password);
      } else {
        // optional: surface the error somehow
        console.error(res.error || "Failed to reset password");
      }
    } finally {
      setPwdBusy(false);
    }
  }


  function copy(str?: string | null) {
    if (!str) return;
    navigator.clipboard?.writeText(str).catch(() => { });
  }

  return (
    <div className="p-4 md:p-6">
      <PageCard
        title={
          <div className="flex items-center gap-3">
            <Button
              as={Link}
              to="/clients"
              size="sm"
              variant="light"
              startContent={<Icon icon="lucide:arrow-left" />}
            >
              Back
            </Button>
            <span className="text-xl md:text-2xl font-semibold">{client.name}</span>
            <Chip size="sm" variant="flat" color={statusColor} className="capitalize">
              {client.status}
            </Chip>
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Tooltip content="Edit organization & contact">
              <Button
                variant="flat"
                startContent={<Icon icon="lucide:edit" />}
                onPress={() => setEditOpen(true)}
              >
                Edit
              </Button>
            </Tooltip>
            <Tooltip content="Reset the password">
              <Button
                variant="flat"
                startContent={<Icon icon="lucide:key-round" />}
                onPress={() => {
                  setTempPwd(null);
                  setResetOpen(true);
                  setCustomPwd("");
                }}
              >
                Reset password
              </Button>
            </Tooltip>

            {canDelete && (
              <Tooltip color="danger" content="Delete client permanently">
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<Icon icon="lucide:trash-2" />}
                  onPress={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
              </Tooltip>
            )}
          </div>
        }
      >
        {/* BODY */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Company */}
          <section className="rounded-2xl border border-divider p-5 bg-content1">
            <div className="text-md font-semibold uppercase tracking-wide text-foreground-500 mb-3">Details</div>
            <div className="space-y-2">
              
              <Row label="Address">{client.address || "—"}
                
                {client.address && (
                  <IconButton onClick={() => copy(client.address)} icon="lucide:copy" tooltip="Copy address" />
                )}
                </Row>
                <Row label="Country">{client.country_name || "—"}</Row>
              <Row label="Phone">
                {client.phone || "—"}
                {client.phone && (
                  <IconButton onClick={() => copy(client.phone)} icon="lucide:copy" tooltip="Copy phone" />
                )}
              </Row>
              <Row label="Tax ID">{client.tax_id || "—"}
                {client.tax_id && (
                  <IconButton onClick={() => copy(client.tax_id)} icon="lucide:copy" tooltip="Copy Tax Id" />
                )}
              </Row>
            </div>
            <Divider className="my-4" />
            <div className="text-xs text-foreground-500">
              Added: {new Date(client.created_at).toLocaleString()}
              {client.updated_at ? ` · Updated: ${new Date(client.updated_at).toLocaleString()}` : ""}
            </div>
          </section>

          {/* Contact */}
          <section className="rounded-2xl border border-divider p-5 bg-content1">
            <div className="text-md font-semibold uppercase tracking-wide text-foreground-500 mb-3">Primary contact</div>
            <div className="space-y-2">
              <Row label="Name">{contactName}</Row>
              <Row label="Email">
                {client.contact_user?.email || "—"}
                {client.contact_user?.email && (
                  <IconButton onClick={() => copy(client.contact_user?.email)} icon="lucide:copy" tooltip="Copy email" />
                )}
              </Row>
              <Row label="Username">
                {client.contact_user?.username || "—"}
                {client.contact_user?.username && (
                  <IconButton
                    onClick={() => copy(client.contact_user?.username)}
                    icon="lucide:copy"
                    tooltip="Copy username"
                  />
                )}
              </Row>
            </div>
          </section>
        </div>
      </PageCard>

      {/* EDIT */}
      <Modal isOpen={editOpen} onOpenChange={setEditOpen} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <Icon icon="lucide:edit" />
                Edit client
              </ModalHeader>
              <ModalBody>
                <ClientForm
                  initial={client}
                  buttonLabel="Update"
                  onSuccess={(updated) => {
                    setClient(updated);
                    onClose();
                  }}
                  onClose={onClose}
                  toast={() => { }}
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* RESET PASSWORD */}
      <Modal isOpen={resetOpen} isDismissable={false} isKeyboardDismissDisabled={false} onOpenChange={(open) => { if (!open) { setTempPwd(null); setCustomPwd(""); } setResetOpen(open); }}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <Icon icon="lucide:key-round" />
                Reset Login Password
              </ModalHeader>
              <ModalBody>
                {tempPwd ? (
                  <p className="text-sm text-foreground-600">
                    New password for <b>{client.name}</b>.
                  </p>
                ) :
                  (<p className="text-sm text-foreground-600">
                    This generates a new password for <b>{client.name}</b>.
                  </p>)}


                {tempPwd ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input readOnly value={tempPwd} className="flex-1" />
                      <Button variant="flat" onPress={() => copy(tempPwd)} startContent={<Icon icon="lucide:copy" />}>
                        Copy
                      </Button>
                    </div>
                    <div className="text-xs text-foreground-500">
                      Share it securely; they should change it after login.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="text-sm text-foreground-500">Custom password (optional)</div>
                      <Input
                        type="password"
                        placeholder="Leave empty to auto-generate"
                        value={customPwd}
                        onValueChange={setCustomPwd}
                      />
                    </div>
                    <div className="text-xs text-foreground-500">
                      If left blank, a strong temporary password will be generated.
                    </div>
                  </>
                )}
              </ModalBody>

              <ModalFooter>
                {!tempPwd ? (
                  <>
                    <Button variant="light" onPress={onClose}>
                      Close
                    </Button>
                    <Button
                      color="primary"
                      className="text-white"
                      isLoading={pwdBusy}
                      onPress={handleGenerateTemp}
                    >
                      {customPwd ? "Set password" : "Generate"}   {/* <-- nicer label */}
                    </Button>
                  </>
                ) : (
                  <Button color="primary" className="text-white" onPress={() => { setTempPwd(null); onClose(); }}>
                    Done
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* DELETE */}
      <Modal isOpen={deleteOpen} onOpenChange={setDeleteOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2 text-danger">
                <Icon icon="lucide:trash-2" />
                Delete client
              </ModalHeader>
              <ModalBody>
                <div className="text-sm text-foreground-600">
                  This will permanently remove <b>{client.name}</b> and related data. This action cannot be undone.
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="danger" isLoading={delBusy} onPress={handleDelete}>
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

/** Small label/value row with subtle styling */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 items-start">
      <div className="col-span-1 text-foreground-500 text-sm">{label}</div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

/** Icon button with tooltip (keeps code compact) */
function IconButton({
  onClick,
  icon,
  tooltip,
}: {
  onClick: () => void;
  icon: string;
  tooltip: string;
}) {
  return (
    <Tooltip content={tooltip}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center justify-center ml-2 h-7 w-7 rounded-md hover:bg-default-100"
        aria-label={tooltip}
        title={tooltip}
      >
        <Icon icon={icon} className="text-foreground-500" />
      </button>
    </Tooltip>
  );
}
