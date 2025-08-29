// src/components/jobs/JobsGrid.tsx
"use client";

import { Card, CardBody, CardFooter, CardHeader, Button, Chip, Tooltip, Skeleton } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { Job } from "../../services/jobsService";

type Props = {
  loading: boolean;
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void | Promise<void>;
};

export default function JobsGrid({ loading, jobs, onEdit, onDelete }: Props) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-28 w-full" />
            <CardHeader className="flex items-center gap-3">
              <Skeleton className="h-5 w-3/4 rounded-lg" />
              <Skeleton className="h-6 w-16 rounded-full ml-auto" />
            </CardHeader>
            <CardBody className="space-y-2">
              <Skeleton className="h-4 w-1/2 rounded-lg" />
              <Skeleton className="h-4 w-1/3 rounded-lg" />
            </CardBody>
            <CardFooter className="flex justify-end gap-2">
              <Skeleton className="h-9 w-16 rounded-lg" />
              <Skeleton className="h-9 w-16 rounded-lg" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!jobs?.length) {
    return <div className="text-sm text-foreground-500 italic py-6">No jobs found.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {jobs.map((job) => {
        const salary =
          job.salary_min != null || job.salary_max != null
            ? `${job.salary_min ?? "—"} - ${job.salary_max ?? "—"} ${job.currency || ""}`.trim()
            : "—";
        const statusColor: "success" | "default" = job.status === "active" ? "success" : "default";
        const imgs = (job as any)?.images ?? [];
        const firstImage = imgs.length ? imgs[0].image : null;
        const remaining =
  job.vacancies_remaining ?? (
    job.vacancies_limit != null && job.vacancies_filled != null
      ? Math.max(0, job.vacancies_limit - job.vacancies_filled)
      : null
  );

const openingsText =
  job.vacancies_limit == null
    ? "Openings: —"
    : `Openings: ${remaining ?? 0} / ${job.vacancies_limit}`;
        return (
          <Card
            key={job.id}
            isPressable
            onPress={() => navigate(`/jobs/${job.id}`)}
            className="overflow-hidden hover:shadow-md transition"
          >
            {firstImage ? (
              <div className="h-28 w-full overflow-hidden bg-content2">
                <img src={firstImage} alt={job.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-28 w-full flex items-center justify-center bg-content2 text-foreground-400">
                <Icon icon="lucide:image-off" />
              </div>
            )}

            <CardHeader className="items-start">
              <div className="flex w-full items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate" title={job.title}>
                    {job.title}
                  </div>
                </div>
                <Chip size="sm" variant="flat" color={statusColor} className="capitalize">
                  {job.status}
                </Chip>
              </div>
            </CardHeader>

            <CardBody className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:wallet" />
                <span className="text-foreground-500">Salary:</span>
                <span className="font-medium">{salary}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="lucide:images" />
                <span className="text-foreground-500">Country:</span>
                <span className="font-medium">{job.country_name}</span>
              </div>
              <div className="flex items-center gap-2">
    <Icon icon="lucide:users" />
    <span className="text-foreground-500">Openings:</span>
    <span className="font-medium">
      {job.vacancies_limit == null
        ? "Not specified"
        : `${remaining ?? 0} / ${job.vacancies_limit}`}
    </span>
  </div>
            </CardBody>

            <CardFooter className="flex justify-end gap-2 pt-0">
              <Tooltip content="Edit">
                <Button
                  size="sm"
                  variant="flat"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(job);
                  }}
                  startContent={<Icon icon="lucide:edit-3" />}
                >
                  Edit
                </Button>
              </Tooltip>
              <Tooltip color="danger" content="Delete">
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(job);
                  }}
                  startContent={<Icon icon="lucide:trash-2" />}
                >
                  Delete
                </Button>
              </Tooltip>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
