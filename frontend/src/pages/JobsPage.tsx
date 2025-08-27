"use client";
import { useEffect, useState } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@heroui/react";
import PageCard from "../components/PageCard";
import JobForm from "../components/jobs/JobForm";
import { Job, listJobs, deleteJob } from "../services/jobsService";
import JobsTable from "../components/jobs/JobsTable";


export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const create = useDisclosure();
  const edit = useDisclosure();
  const [editing, setEditing] = useState<Job | null>(null);

  async function load() {
    setLoading(true);
    const res = await listJobs();
    if (res.success) setJobs(res.returnedData);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const actions = (
    <Button color="primary" className="text-white"  onPress={create.onOpen}>
      Add Job
    </Button>
  );

  return (
    <div className="p-4 md:p-6">
      <PageCard title="Jobs" actions={actions}>
        <JobsTable
          loading={loading}
          jobs={jobs}
          onEdit={(job) => {
            setEditing(job);
            edit.onOpen();
          }}
          onDelete={async (job) => {
            const ok = window.confirm(`Delete "${job.title}"?`);
            if (!ok) return;
            await deleteJob(job.id);
            load();
          }}
        />
      </PageCard>

      {/* Create */}
      <Modal isOpen={create.isOpen} onOpenChange={create.onOpenChange}>
        <ModalContent>
          <ModalHeader>Add Job</ModalHeader>
          <ModalBody>
            <JobForm mode="create" onSuccess={load} onDone={create.onClose} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit */}
      <Modal isOpen={edit.isOpen} onOpenChange={edit.onOpenChange}>
        <ModalContent>
          <ModalHeader>Edit Job</ModalHeader>
          <ModalBody>
            {editing && (
              <JobForm
                mode="edit"
                initial={editing}
                onSuccess={load}
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
