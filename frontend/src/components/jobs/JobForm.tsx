// src/components/jobs/JobForm.tsx
"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea, Select, SelectItem } from "@heroui/react";
import { Job, UpsertJobPayload, createJob, updateJob } from "../../services/jobsService";


const schema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  salary_min: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().optional()),
  salary_max: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().optional()),
  currency: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

type Values = z.infer<typeof schema>;

export default function JobForm({
  mode,
  initial,
  onSuccess,
  onDone,
}: {
  mode: "create" | "edit";
  initial?: Job;
  onSuccess?: (j: Job) => void;
  onDone?: () => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? { status: "active" },
  });

  async function onSubmit(values: Values) {
    const files = (document.getElementById("job-image") as HTMLInputElement)?.files;
    const payload: UpsertJobPayload = { ...values, image_files: files ? Array.from(files) : [] };

    const res = mode === "create"
      ? await createJob(payload)
      : await updateJob(String(initial?.id), payload);

    if (res.success) {
      onSuccess?.(res.returnedData);
      onDone?.();
    } else {
      alert(res.error?.detail ?? "Failed to save job");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Input label="Title" {...register("title")} isInvalid={!!errors.title} errorMessage={errors.title?.message} />
      <Textarea label="Description" {...register("description")} />
      <Input label="Salary Min" type="number" {...register("salary_min")} />
      <Input label="Salary Max" type="number" {...register("salary_max")} />
      <Input label="Currency" {...register("currency")} />
      <Select label="Status" {...register("status" as const)}>
        <SelectItem key="active" value="active">Active</SelectItem>
        <SelectItem key="inactive" value="inactive">Inactive</SelectItem>
      </Select>
      <div>
        <label>Images</label>
        <input id="job-image" type="file" multiple />
      </div>
      <div className="flex justify-end gap-2">
        <Button onPress={onDone} variant="flat">Cancel</Button>
        <Button type="submit" color="primary" isLoading={isSubmitting}>
          {mode === "create" ? "Create" : "Save"}
        </Button>
      </div>
    </form>
  );
}
