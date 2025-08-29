"use client";
import { useEffect, useState } from "react";
import { Button, Divider, Skeleton } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageCard from "../../components/PageCard";
import JobForm from "../../components/jobs/JobForm";
import { api } from "../../lib/api";
import type { Job } from "../../services/jobsService";

export default function JobEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<Job>(`/jobs/${id}/`);
        setJob(data);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message || "Failed to load job");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <PageCard title={<Skeleton className="h-6 w-40 rounded-lg" />}>
          <Skeleton className="h-6 w-56 rounded-lg" />
          <Divider className="my-4" />
          <Skeleton className="h-10 w-full rounded-lg" />
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

  return (
    <div className="p-4 md:p-6">
      <PageCard
        title={
          <div className="flex items-center gap-3">
            <Button as={Link} to={`/jobs/${job.id}`} size="sm" variant="light" startContent={<Icon icon="lucide:arrow-left" />}>
              Back
            </Button>
            <span className="text-xl md:text-2xl font-semibold">Edit: {job.title}</span>
          </div>
        }
      >
        <div className="max-w-3xl">
          <JobForm
            mode="edit"
            initial={job}
            onSuccess={() => navigate(`/jobs/${job.id}`)}
            onDone={() => navigate(`/jobs/${job.id}`)}
          />
        </div>
      </PageCard>
    </div>
  );
}
