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
import ClientModal from "../../components/clients/ClientModal";
import {
  Client,
  getClient,
  deleteClient,
  resetContactPassword,
} from "../../services/clientService";
import { useAuth } from "../../context/AuthContext";

// Skeleton loader for details
function DetailsSkeleton() {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px] grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Divider className="my-2" />
            <Skeleton className="h-4 w-56 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-lg" />
            <Skeleton className="h-4 w-40 rounded-lg" />
            <Skeleton className="h-4 w-44 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Config for modal footer buttons
const getFooterButtons = ({
  onClose,
  onDelete,
  onGenerate,
  loading,
  type,
}: {
  onClose: () => void;
  onDelete?: () => void;
  onGenerate?: () => void;
  loading?: boolean;
  type: "edit" | "delete" | "reset" | "default";
}) => {
  switch (type) {
    case "edit":
      return [
        { label: "Close", variant: "light", onClick: onClose },
      ];
    case "delete":
      return [
        { label: "Cancel", variant: "light", onClick: onClose },
        { label: "Delete", variant: "solid", color: "danger", onClick: onDelete!, loading },
      ];
    case "reset":
      return [
        { label: "Close", variant: "light", onClick: onClose },
        { label: "Generate", variant: "solid", color: "primary", onClick: onGenerate!, loading },
      ];
    default:
      return [{ label: "Close", variant: "light", onClick: onClose }];
  }
};

export default function ClientDetailsPage() {
  const { user } = useAuth();
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

  const contactRows = useMemo(() => {
    if (!client?.contact_user) return [];
    const { first_name, last_name, username, email } = client.contact_user;
    return [
      { label: "Name", value: `${first_name || ""} ${last_name || ""}`.trim() || username || "—" },
      { label: "Email", value: email || "—", copy: !!email },
      { label: "Username", value: username || "—", copy: !!username },
    ];
  }, [client]);

  const companyRows = useMemo(() => [
    { label: "Address", value: client?.address || "—", copy: !!client?.address },
    { label: "Country", value: client?.country_name || "—" },
    { label: "Phone", value: client?.phone || "—", copy: !!client?.phone },
    { label: "Tax ID", value: client?.tax_id || "—", copy: !!client?.tax_id },
  ], [client]);

  const statusColor =
    client?.status === "active" ? "success" : client?.status === "suspended" ? "warning" : "default";

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

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 h-screen overflow-auto">
        <PageCard
          title={
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-40 rounded-lg" />
            </div>
          }
        >
          <DetailsSkeleton />
        </PageCard>
      </div>
    );
  }

  if (err || !client) {
    return (
      <div className="p-6 h-screen overflow-auto">
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger">
          <div className="font-semibold mb-1">Couldn't load client</div>
          <div className="text-sm opacity-80">{err || "Not found"}</div>
          <div className="mt-3">
            <Button as={Link} to="/clients" variant="flat" size="sm" className="w-full sm:w-auto h-9" startContent={<Icon icon="lucide:arrow-left" />}>
              Back to Clients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 h-screen overflow-auto">
      <PageCard
        title={
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Top row: Back arrow, name, status */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button
                as={Link}
                to="/clients"
                size="sm"
                variant="light"
                className="p-0 h-9 min-w-0 w-full sm:w-auto"
              >
                <Icon icon="lucide:arrow-left" className="font-bold text-2xl md:text-3xl" />
              </Button>
              <span className="font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl">{client.name}</span>
              <Chip
                size="md"
                variant="flat"
                color={statusColor}
                className="capitalize px-3 py-1 text-base sm:text-lg"
              >
                {client.status}
              </Chip>
            </div>
            {/* Actions row: Edit, Reset, Delete */}
            <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:gap-2">
              {[
                {
                  label: "Edit",
                  icon: "lucide:edit",
                  onClick: () => setEditOpen(true),
                  tooltip: "Edit organization & contact",
                  variant: "flat",
                },
                {
                  label: "Reset password",
                  icon: "lucide:key-round",
                  onClick: () => {
                    setTempPwd(null);
                    setResetOpen(true);
                    setCustomPwd("");
                  },
                  tooltip: "Reset the password",
                  variant: "flat",
                },
                canDelete && {
                  label: "Delete",
                  icon: "lucide:trash-2",
                  onClick: () => setDeleteOpen(true),
                  tooltip: "Delete client permanently",
                  variant: "flat",
                  color: "danger",
                },
              ]
                .filter(Boolean)
                .map((btn, idx) => (
                  <Tooltip key={btn.label} content={btn.tooltip} color={btn.color}>
                    <Button
                      variant={btn.variant}
                      color={btn.color}
                      startContent={<Icon icon={btn.icon} />}
                      onPress={btn.onClick}
                      size="sm"
                      className="w-full sm:w-auto h-9"
                    >
                      {btn.label}
                    </Button>
                  </Tooltip>
                ))}
            </div>
          </div>
        }
      >
        {/* BODY */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px] grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company */}
            <section className="rounded-2xl border border-divider p-3 sm:p-5 bg-content1">
              <div className="font-semibold uppercase tracking-wide text-foreground-500 mb-3 text-base sm:text-lg md:text-xl">
                Details
              </div>
              <div className="space-y-2">
                {companyRows.map((row) => (
                  <Row key={row.label} label={row.label}>
                    {row.value}
                    {row.copy && (
                      <IconButton onClick={() => copy(row.value)} icon="lucide:copy" tooltip={`Copy ${row.label.toLowerCase()}`} />
                    )}
                  </Row>
                ))}
              </div>
              <Divider className="my-4" />
              <div className="text-xs text-foreground-500">
                Added: {new Date(client.created_at).toLocaleString()}
                {client.updated_at ? ` · Updated: ${new Date(client.updated_at).toLocaleString()}` : ""}
              </div>
            </section>

            {/* Contact */}
            <section className="rounded-2xl border border-divider p-3 sm:p-5 bg-content1">
              <div className="font-semibold uppercase tracking-wide text-foreground-500 mb-3 text-base sm:text-lg md:text-xl">
                Primary contact
              </div>
              <div className="space-y-2">
                {contactRows.map((row) => (
                  <Row key={row.label} label={row.label}>
                    {row.value}
                    {row.copy && (
                      <IconButton onClick={() => copy(row.value)} icon="lucide:copy" tooltip={`Copy ${row.label.toLowerCase()}`} />
                    )}
                  </Row>
                ))}
              </div>
            </section>
          </div>
        </div>
      </PageCard>

      {/* EDIT - use ClientModal with dynamic footer */}
      <ClientModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit client"
        footerContent={getFooterButtons({
          onClose: () => setEditOpen(false),
          type: "edit",
        })}
      >
        <ClientForm
          initial={{
            ...client,
            country: client?.country || client?.country_name || "",
          }}
          buttonLabel="Update"
          onSuccess={(updated) => {
            setClient(updated);
            setEditOpen(false);
          }}
          onClose={() => setEditOpen(false)}
          toast={() => {}}
        />
      </ClientModal>

      {/* RESET PASSWORD */}
      <ClientModal
        isOpen={resetOpen}
        onClose={() => {
          setTempPwd(null);
          setCustomPwd("");
          setResetOpen(false);
        }}
        title="Reset Login Password"
        footerContent={
          tempPwd
            ? [
                {
                  label: "Done",
                  variant: "solid",
                  color: "primary",
                  onClick: () => {
                    setTempPwd(null);
                    setResetOpen(false);
                  },
                },
              ]
            : [
                {
                  label: "Close",
                  variant: "light",
                  onClick: () => {
                    setTempPwd(null);
                    setCustomPwd("");
                    setResetOpen(false);
                  },
                },
                {
                  label: customPwd ? "Set password" : "Generate",
                  variant: "solid",
                  color: "primary",
                  loading: pwdBusy,
                  onClick: handleGenerateTemp,
                },
              ]
        }
      >
        <div>
          {tempPwd ? (
            <>
              <p className="text-sm text-foreground-600">
                New password for <b>{client.name}</b>.
              </p>
              <div className="space-y-2 mt-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input readOnly value={tempPwd} className="flex-1" />
                  <Button
                    variant="flat"
                    size="sm"
                    onPress={() => copy(tempPwd)}
                    startContent={<Icon icon="lucide:copy" />}
                    className="h-9"
                  >
                    Copy
                  </Button>
                </div>
                <div className="text-xs text-foreground-500">
                  Share it securely; they should change it after login.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <div className="text-sm text-foreground-500">Custom password (optional)</div>
                <Input
                  type="password"
                  placeholder="Leave empty to auto-generate"
                  value={customPwd}
                  onValueChange={setCustomPwd}
                  className="h-9"
                />
              </div>
              <div className="text-xs text-foreground-500">
                If left blank, a strong temporary password will be generated.
              </div>
            </>
          )}
        </div>
      </ClientModal>

      {/* DELETE */}
      <ClientModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete client"
        footerContent={getFooterButtons({
          onClose: () => setDeleteOpen(false),
          onDelete: handleDelete,
          loading: delBusy,
          type: "delete",
        })}
      >
        <div className="text-sm text-foreground-600">
          This will permanently remove <b>{client.name}</b> and related data. This action cannot be undone.
        </div>
      </ClientModal>
    </div>
  );
}

/** Responsive label/value row */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 w-full">
      <div className="text-foreground-500 text-sm sm:w-32 sm:flex-shrink-0 break-words">{label}</div>
      <div className="flex-1 flex items-center break-words min-w-0">
        <span className="truncate w-full">{children}</span>
      </div>
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
