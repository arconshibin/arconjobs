// src/components/jobs/JobForm.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Input,
  Select,
  SelectItem,
  addToast,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import { Job, UpsertJobPayload, createJob, updateJob } from "../../services/jobsService";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { Country, getCountries } from "../../services/directoryService";
import "react-quill/dist/quill.snow.css";
// TinyMCE core (self-hosted)
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom"; // TinyMCE 6 model

// Free plugins only
import "tinymce/plugins/lists";
import "tinymce/plugins/link";
import "tinymce/plugins/code";
import "tinymce/plugins/table";
import "tinymce/plugins/autoresize";

// Styles (bundled by Vite)
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/skins/ui/oxide/content.min.css";
import "tinymce/skins/content/default/content.css";

// React wrapper
import { Editor } from "@tinymce/tinymce-react";



const schema = z.object({
  title: z.string().min(2, "Title is required"),
  organization: z.string().optional(),
  description: z.string().optional(),
  salary_min: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().optional()),
  salary_max: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().optional()),
  currency: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  vacancies: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().nonnegative().optional()
  ),
  country_code: z.string().optional(),
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
  const { user } = useAuth();
  const isAdmin = !!(user?.is_staff || user?.is_superuser);
  const currentOrgId = (user as any)?.profile?.organization ?? undefined;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: (() => {
      if (!initial) return { status: "active" };
      return {
        title: initial.title,
        description: initial.description ?? undefined,
        salary_min: initial.salary_min ?? undefined,
        salary_max: initial.salary_max ?? undefined,
        currency: initial.currency ?? undefined,
        status: (initial.status as any) ?? "active",
        organization: initial.organization ?? undefined,
        vacancies: initial.vacancies_limit ?? initial.vacancies_initial ?? undefined,
        country_code:
          typeof initial.country === "string"
            ? initial.country
            : (initial as any).country?.code ?? "",
      } as any;
    })(),
  });

  // ---- Country selector state ----
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryQuery, setCountryQuery] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      const res = await getCountries();
      if (!ignore && res.success) setCountries(res.returnedData);
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => {
      const name = c.name.toLowerCase();
      const code = c.code.toLowerCase();
      const dial = (c.dial_code || "").toLowerCase().replace(/^\+/, "");
      const qn = q.replace(/^\+/, "");
      return (
        name.includes(q) ||
        code.includes(q) ||
        (c.dial_code || "").toLowerCase().includes(q) ||
        dial.includes(qn)
      );
    });
  }, [countries, countryQuery]);

  const selectedCode = (watch("country_code") || "").toUpperCase();
  useEffect(() => {
    if (!selectedCode || !countries.length) return;
    const item = countries.find((c) => c.code.toUpperCase() === selectedCode);
    if (item) {
      setCountryQuery(
        `${item.name} (${selectedCode})${item.dial_code ? ` — ${item.dial_code}` : ""}`
      );
    }
  }, [countries, selectedCode]);

  // ---- Clients (organization) ----
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    if (!isAdmin && currentOrgId) {
      setValue("organization" as any, String(currentOrgId));
    }
  }, [isAdmin, currentOrgId, setValue]);

  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    (async () => {
      try {
        const data = await api.get<any[]>("/accounts/clients/");
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : (data as any).results ?? [];
        setClients(arr.map((c: any) => ({ id: c.id ?? c.pk ?? c.uuid, name: c.name })));
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  // ---- Submit ----
  async function onSubmit(values: Values) {
    const files = (document.getElementById("job-image") as HTMLInputElement)?.files;
    const payload: UpsertJobPayload = {
      ...values,
      image_files: files ? Array.from(files) : [],
    };

    // Map vacancies
    if (mode === "create") {
      payload.vacancies_initial = values.vacancies;
      payload.vacancies_limit = values.vacancies;
    } else {
      payload.vacancies_limit = values.vacancies;
    }
    delete (payload as any).vacancies;

    // Map country_code → country
    if (values.country_code) {
      payload.country = values.country_code;
    }
    delete (payload as any).country_code;

    // Non-admins cannot override org
    if (!isAdmin && currentOrgId) {
      payload.organization = String(currentOrgId);
    }

    const res = mode === "create"
      ? await createJob(payload)
      : await updateJob(String(initial?.id), payload);

    if (res.success) {
      onSuccess?.(res.returnedData);
      addToast({ title: "Job saved", description: "Job was saved successfully." });
      onDone?.();
    } else {
      addToast({
        title: "Failed to save",
        description: String(res.error?.detail ?? res.error ?? "Failed to save job"),
      });
    }
  }

  // ---- Render ----
  const clientItems = clients.map((c) => (
    <SelectItem key={String(c.id)}>{c.name}</SelectItem>
  ));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Organization */}
      {isAdmin ? (
        <div>
          <Controller
            control={control}
            name="organization"
            render={({ field }) => (
              <Select
                label="Client"
                selectionMode="single"
                selectedKeys={field.value ? [String(field.value)] : [""]}
                onSelectionChange={(keys) => {
                  if (keys === "all") return;
                  field.onChange(Array.from(keys)[0] ?? "");
                }}
              >
                <SelectItem key="">-- select client --</SelectItem>
                {clientItems as any}
              </Select>
            )}
          />
        </div>
      ) : (
        <Input type="hidden" {...register("organization" as const)} />
      )}

      <Input
        label="Title"
        {...register("title")}
        isInvalid={!!errors.title}
        errorMessage={String(errors.title?.message ?? "")}
      />
      <Controller
  control={control}
  name="description"
  render={({ field }) => (
    <div className="space-y-2">
      <label className="text-sm text-foreground-500">Description</label>
      <Editor
        value={field.value || ""}
        onEditorChange={(val) => field.onChange(val)}
        init={{
          height: 360,
          menubar: false,
          plugins: "lists link code table autoresize",
          toolbar:
            "blocks | bold italic underline | bullist numlist outdent indent | link table | removeformat | code",
          branding: false,
          statusbar: false,
          paste_data_images: false,
          autoresize_bottom_margin: 16,
          content_style: `
            body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial; font-size:14px; }
            h1,h2,h3 { margin:.6em 0 .4em; }
            ul,ol { padding-left: 1.4rem; }
            table { border-collapse: collapse; width: 100%; }
            table, th, td { border: 1px solid #e5e7eb; }
            th, td { padding:.4em .6em; }
          `,
        }}
      />
      {errors.description && (
        <p className="text-danger text-sm">{String(errors.description.message)}</p>
      )}
    </div>
  )}
/>



      {/* Country Autocomplete */}
      <Controller
        control={control}
        name="country_code"
        render={({ field }) => (
          <Autocomplete
            label="Country"
            items={filtered}
            selectedKey={selectedCode || null}
            inputValue={countryQuery}
            onInputChange={setCountryQuery}
            menuTrigger="input"
            allowsCustomValue={false}
            autoComplete="off"
            listboxProps={{ emptyContent: "No matching countries" }}
            popoverProps={{ placement: "bottom", offset: 8 }}
            onSelectionChange={(key) => {
              const code = (key ?? "").toString().toUpperCase();
              const item = countries.find((c) => c.code.toUpperCase() === code);
              field.onChange(code);
              setCountryQuery(
                item
                  ? `${item.name} (${code})${item.dial_code ? ` — ${item.dial_code}` : ""}`
                  : ""
              );
            }}
          >
            {(item) => (
              <AutocompleteItem
                key={item.code.toUpperCase()}
                textValue={`${item.name} ${item.code} ${item.dial_code ?? ""}`}
              >
                {item.name} ({item.code.toUpperCase()})
                {item.dial_code ? ` — ${item.dial_code}` : ""}
              </AutocompleteItem>
            )}
          </Autocomplete>
        )}
      />

      <Input label="Salary Min" type="number" {...register("salary_min")} />
      <Input label="Salary Max" type="number" {...register("salary_max")} />
      <Input label="Currency" {...register("currency")} />

      {mode === "create" ? (
        <Input
          label="Vacancies"
          type="number"
          {...register("vacancies" as const)}
          description="Total number of openings."
        />
      ) : (
        <Input
          label="Vacancies (limit / current cap)"
          type="number"
          {...register("vacancies" as const)}
          description="Maximum number allowed to be filled now."
        />
      )}

      <div>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              label="Status"
              selectionMode="single"
              selectedKeys={[String(field.value ?? "active")]}
              onSelectionChange={(keys) => {
                if (keys === "all") return;
                field.onChange(String(Array.from(keys)[0] ?? "active"));
              }}
            >
              <SelectItem key="active">Active</SelectItem>
              <SelectItem key="inactive">Inactive</SelectItem>
            </Select>
          )}
        />
      </div>

      <div>
        <Input id="job-image" label="Images" type="file" multiple />
      </div>

      <div className="flex justify-end gap-2">
        <Button onPress={onDone} variant="flat">
          Cancel
        </Button>
        <Button type="submit" color="primary" className="text-white" isLoading={isSubmitting}>
          {mode === "create" ? "Create" : "Save"}
        </Button>
      </div>
    </form>
  );
}
