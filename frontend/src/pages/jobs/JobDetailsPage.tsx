// src/pages/JobDetailsPage.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Chip,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Skeleton,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import PageCard from "../../components/PageCard";
import JobForm from "../../components/jobs/JobForm";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import type { Job } from "../../services/jobsService";

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() as any;

  const isAdmin = !!user?.is_staff || !!user?.is_superuser;
console.log(user);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.get<Job>(`/jobs/${id}/`);
      setJob(data);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Failed to load job");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const statusColor = useMemo<"success" | "default">(
    () => (job?.status === "active" ? "success" : "default"),
    [job]
  );

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
              <Skeleton className="h-4 w-24 rounded-lg" />
              <Skeleton className="h-6 w-56 rounded-lg" />
              <Divider className="my-2" />
              <Skeleton className="h-4 w-64 rounded-lg" />
              <Skeleton className="h-4 w-40 rounded-lg" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-24 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-lg" />
            </div>
          </div>
        </PageCard>
      </div>
    );
  }

  if (err || !job) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger">
          <div className="font-semibold mb-1">Couldn't load job</div>
          <div className="text-sm opacity-80">{err || "Not found"}</div>
          <div className="mt-3">
            <Button as={Link} to="/jobs" variant="flat" startContent={<Icon icon="lucide:arrow-left" />}>
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const orgId = String((job as any).organization);
  const salary =
    job.salary_min != null || job.salary_max != null
      ? `${job.salary_min ?? "—"} - ${job.salary_max ?? "—"} ${job.currency || ""}`.trim()
      : "—";

  const country = (job as any).country;
  const countryText =
    typeof country === "string" ? country : country?.name ?? country?.code ?? "—";
const remaining =
  (job as any).vacancies_remaining ??
  ((job as any).vacancies_limit != null
    ? Math.max(0, (job as any).vacancies_limit - (job as any).vacancies_filled)
    : null);
  return (
    <div className="p-4 md:p-6">
      <PageCard
        title={
          <div className="flex items-center gap-3">
            <Button
              as={Link}
              to="/jobs"
              size="sm"
              variant="light"
              startContent={<Icon icon="lucide:arrow-left" />}
            >
              Back
            </Button>
            <span className="text-xl md:text-2xl font-semibold">{job.title}</span>
            <Chip size="sm" variant="flat" color={statusColor} className="capitalize">
              {job.status}
            </Chip>
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Tooltip content="Edit job">
              <Button
              as={Link} to={`/jobs/${job.id}/edit`}
                variant="flat"
                startContent={<Icon icon="lucide:edit" />}
                onPress={() => setEditOpen(true)}
              >
                Edit
              </Button>
            </Tooltip>
          </div>
        }
      >
        <div className="grid md:grid-cols-2 gap-6">
          {/* Organization card — only for admin/staff */}
          {isAdmin && (
            <section
              className="rounded-2xl border border-divider p-5 bg-content1 cursor-pointer hover:bg-content2 transition"
              onClick={() => navigate(`/clients/${orgId}`)}
              title="Open client page"
            >
              <div className="text-md font-semibold uppercase tracking-wide text-foreground-500 mb-3">
                Client
              </div>
              <div className="space-y-2">
                <Row label="Organization ID">{orgId}</Row>
                <Row label="Country">{countryText}</Row>
                <Row label="Status">
                  <Chip size="sm" variant="flat" color={statusColor} className="capitalize">
                    {job.status}
                  </Chip>
                </Row>
              </div>
              <Divider className="my-4" />
              <div className="text-xs text-foreground-500">
                Added: {new Date(job.created_at).toLocaleString()}
                {job.updated_at ? ` · Updated: ${new Date(job.updated_at).toLocaleString()}` : ""}
              </div>
            </section>
          )}

          {/* Compensation */}
          <section className="rounded-2xl border border-divider p-5 bg-content1">
            <div className="text-md font-semibold uppercase tracking-wide text-foreground-500 mb-3">
              Compensation
            </div>
            <div className="space-y-2">
              <Row label="Salary">{salary}</Row>
              <Row label="Currency">{job.currency || "—"}</Row>
            </div>
          </section>
{/* Vacancies */}
<section className="rounded-2xl border border-divider p-5 bg-content1">
  <div className="text-md font-semibold uppercase tracking-wide text-foreground-500 mb-3">
    Vacancies
  </div>
  <div className="space-y-2">
    <Row label="Initially announced">
      {(job as any).vacancies_initial ?? "—"}
    </Row>
    <Row label="Current limit">
      {(job as any).vacancies_limit ?? "—"}
    </Row>
    <Row label="Filled">
      {(job as any).vacancies_filled ?? 0}
    </Row>
    <Row label="Remaining">
      {remaining ?? "—"}
    </Row>
  </div>
</section>

          {/* Description */}
          <section className="rounded-2xl border border-divider p-5 bg-content1 md:col-span-2">
  <div className="text-md font-semibold uppercase tracking-wide text-foreground-500 mb-3">
    Description
  </div>
  <div
    className="prose max-w-none [&_ul]:list-disc [&_ol]:list-decimal"
    dangerouslySetInnerHTML={{ __html: job.description || "" }}
  />
</section>

          {/* Images */}
          {!!(job as any)?.images?.length && (
            <section className="rounded-2xl border border-divider p-5 bg-content1 md:col-span-2">
              <div className="text-md font-semibold uppercase tracking-wide text-foreground-500 mb-3">
                Images
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(job as any).images.map((img: any) => (
                  <div key={img.id} className="rounded-xl overflow-hidden border border-divider bg-content2">
                    <img
                      src={img.image}
                      alt={img.caption || "Job image"}
                      className="w-full h-40 object-cover"
                    />
                    {img.caption ? (
                      <div className="px-3 py-2 text-xs text-foreground-500">{img.caption}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </PageCard>

      {/* EDIT */}
      <Modal isOpen={editOpen} onOpenChange={setEditOpen} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <Icon icon="lucide:edit" /> Edit Job
              </ModalHeader>
              <ModalBody>
                <JobForm
                  mode="edit"
                  initial={job as any}
                  onSuccess={(updated) => {
                    setJob(updated);
                    onClose();
                  }}
                  onDone={onClose}
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 items-start">
      <div className="col-span-1 text-foreground-500 text-sm">{label}</div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}
