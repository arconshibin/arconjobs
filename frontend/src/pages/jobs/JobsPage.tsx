// src/pages/JobsPage.tsx
"use client";
import { useEffect, useState } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@heroui/react";
import PageCard from "../../components/PageCard";
import JobForm from "../../components/jobs/JobForm";
import { Job, listJobs, deleteJob } from "../../services/jobsService";
import { Icon } from "@iconify/react";
import { useAuth } from "../../context/AuthContext";
import JobsGrid from "../../components/jobs/JobsGrid";
import JobsToolbar from "../../components/jobs/JobsToolbar";
import { Link, useNavigate } from "react-router-dom";
export default function JobsPage() {
  const { user } = useAuth() as any;
  const isAdmin = !!user?.is_staff || !!user?.is_superuser;
const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // filters/search/sort
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
  const [titleQ, setTitleQ] = useState("");
  const [orgQ, setOrgQ] = useState("");
  const [ordering, setOrdering] = useState<"new" | "old" | "title">("new");

  const create = useDisclosure();
  const edit = useDisclosure();
  const [editing, setEditing] = useState<Job | null>(null);

  async function load(params?: Record<string, string | number | boolean | undefined | null>) {
    setLoading(true);
    const res = await listJobs(params);
    if (res.success) setJobs(res.returnedData);
    setLoading(false);
  }

  useEffect(() => {
    applyFilters(); // initial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters() {
    const terms = [titleQ, isAdmin ? orgQ : ""].filter(Boolean).join(" ").trim();
    const searchParam = terms.length ? terms : undefined;

    // map UI sort => DRF ordering
    const orderingParam =
      ordering === "old" ? "created_at" :
      ordering === "title" ? "title" : "-created_at";

    const query = {
      status: status || undefined,
      search: searchParam,
      ordering: orderingParam,
    };
    void load(query);
  }

  const actions = (
    <Button color="primary" className="text-white" as={Link} to={"/jobs/new"}>
      <Icon icon="lucide:plus" className="mr-1" />
      Add Job
    </Button>
  );

  return (
    <div className="p-4 md:p-6 ">
      <PageCard title="Jobs" actions={actions}>
        <JobsToolbar
          count={jobs.length}
          loading={loading}
          titleQ={titleQ}
          setTitleQ={setTitleQ}
          status={status}
          setStatus={setStatus}
          isAdmin={isAdmin}
          orgQ={orgQ}
          setOrgQ={setOrgQ}
          ordering={ordering}
          setOrdering={setOrdering}
          onApply={applyFilters}
          onClear={() => setJobs([])}
        />

        <div className="mt-4">
          <JobsGrid
  loading={loading}
  jobs={jobs}
  onEdit={(job) => navigate(`/jobs/${job.id}/edit`)}
  onDelete={async (job) => {
    const ok = window.confirm(`Delete "${job.title}"?`);
    if (!ok) return;
    await deleteJob(job.id);
    applyFilters();
  }}
/>
        </div>
      </PageCard>

      {/* Create */}
      <Modal isOpen={create.isOpen} onOpenChange={create.onOpenChange} isKeyboardDismissDisabled={false} isDismissable={false} placement="center" size="lg">
        <ModalContent>
          <ModalHeader>Add New Job</ModalHeader>
          <ModalBody>
            <JobForm
              mode="create"
              onSuccess={applyFilters}
              onDone={create.onClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit */}
      <Modal isOpen={edit.isOpen} onOpenChange={edit.onOpenChange} isKeyboardDismissDisabled={false} isDismissable={false} placement="center" size="xl" 

  scrollBehavior="inside" >
        <ModalContent>
          <ModalHeader>Edit Job</ModalHeader>
          <ModalBody>
            {editing && (
              <JobForm
                mode="edit"
                initial={editing}
                onSuccess={applyFilters}
                onDone={() => {
                  setEditing(null);
                  edit.onClose();
                }}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
