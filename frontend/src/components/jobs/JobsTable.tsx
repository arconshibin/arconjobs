"use client";
import { Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Button, Skeleton } from "@heroui/react";
import { Job } from "../../services/jobsService";
import { Icon } from "@iconify/react";


export default function JobsTable({
  jobs,
  loading,
  onEdit,
  onDelete,
}: {
  jobs: Job[];
  loading: boolean;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Table aria-label="Jobs table">
      <TableHeader>
        <TableColumn>Title</TableColumn>
        <TableColumn>Status</TableColumn>
        <TableColumn>Salary</TableColumn>
        <TableColumn>Images</TableColumn>
        <TableColumn align="end">Actions</TableColumn>
      </TableHeader>
      <TableBody emptyContent="No jobs yet.">
        {jobs.map((j) => (
          <TableRow key={j.id}>
            <TableCell className="font-medium">{j.title}</TableCell>
            <TableCell>
              <Chip size="sm" variant="flat">
                {j.status}
              </Chip>
            </TableCell>
            <TableCell>
              {j.salary_min} - {j.salary_max} {j.currency}
            </TableCell>
            <TableCell>{j.images?.length ?? 0}</TableCell>
            <TableCell className="flex justify-end gap-2">
              <Tooltip content="Edit">
                <Button isIconOnly variant="flat" onPress={() => onEdit(j)}>
                  <Icon icon="lucide:edit" className="mr-1" />
                </Button>
              </Tooltip>
              <Tooltip color="danger" content="Delete">
                <Button isIconOnly color="danger" variant="flat" onPress={() => onDelete(j)}>
                  <Icon icon="lucide:trash" className="mr-1" />
                </Button>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
