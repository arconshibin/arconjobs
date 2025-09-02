// src/components/clients/ClientForm.tsx
"use client";

import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { Country, getCountries } from "../../services/directoryService";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Autocomplete,
  AutocompleteItem,
  Textarea,
  Divider,
} from "@heroui/react";
import {
  Client,
  ClientStatus,
  createClient,
  updateClient,
} from "../../services/clientService";
// no extra React hooks required
/** ---------- Schemas ---------- */
const orgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  country_code: z.string().default(""),
  address: z.string().default(""),
  tax_id: z.string().default(""),
  phone: z.string().default(""),
  status: z.enum(["active", "suspended", "archived"]).default("active"),
});

const contactCreateSchema = z.object({
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  email: z.string().default(""),
  username: z.string().default(""),
  password: z.string().default(""),
});

const contactEditSchema = z.object({
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  email: z.string().default(""),
  username: z.string().default(""),
});

const baseFormSchema = z.object({
  org: orgSchema,
  createContact: z.boolean().default(false),
  contact: contactCreateSchema,
  contactEdit: contactEditSchema.optional(), // used only on edit
});

const formSchema = baseFormSchema.superRefine((val, ctx) => {
  const cc = (val.org.country_code || "").toUpperCase();
  if (cc && !/^[A-Z]{2}$/.test(cc)) {
    ctx.addIssue({
      code: "custom",
      path: ["org", "country_code"],
      message: "Use 2-letter code (e.g., PL)",
    });
  }

  // Create validation
  if (val.createContact) {
    const c = val.contact;
    if (!c.first_name.trim())
      ctx.addIssue({ code: "custom", path: ["contact", "first_name"], message: "First name is required" });
    if (!c.last_name.trim())
      ctx.addIssue({ code: "custom", path: ["contact", "last_name"], message: "Last name is required" });
    if (!c.email.trim())
      ctx.addIssue({ code: "custom", path: ["contact", "email"], message: "Email is required" });
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email))
      ctx.addIssue({ code: "custom", path: ["contact", "email"], message: "Invalid email" });
  }

  // Edit validation (if provided, email must be valid)
  if (val.contactEdit) {
    const e = val.contactEdit.email?.trim();
    if (e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      ctx.addIssue({ code: "custom", path: ["contactEdit", "email"], message: "Invalid email" });
    }
  }
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const statusOptions: { label: string; value: ClientStatus }[] = [
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Archived", value: "archived" },
];



export default function ClientForm({
  initial,
  onSuccess,
  onClose,
  buttonLabel = "Save",
  toast,
}: {
  initial?: Partial<Client>;
  onSuccess?: (c: Client) => void;
  onClose?: () => void;
  buttonLabel?: string;
  toast?: (msg: string, type?: "success" | "danger") => void;
}) {
  const isCreate = !initial?.id;
  const hasEditableContact = !!(!isCreate && initial?.contact_user);
  // computedDefaults not required; keep logic inline in defaultValues


  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      org: {
        name: initial?.name ?? "",
        country_code: initial?.country_code ?? "",
        address: initial?.address ?? "",
        tax_id: initial?.tax_id ?? "",
        phone: initial?.phone ?? "",
        status: (initial?.status as ClientStatus) ?? "active",
      },
      createContact: false,
      contact: {
        first_name: "",
        last_name: "",
        email: "",
        username: "",
        password: "",
      },
      contactEdit: hasEditableContact
        ? {
          first_name: initial?.contact_user?.first_name ?? "",
          last_name: initial?.contact_user?.last_name ?? "",
          email: initial?.contact_user?.email ?? "",
          username: initial?.contact_user?.username ?? "",
        }
        : undefined,
    },
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryQuery, setCountryQuery] = useState("");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  useEffect(() => {
    let ignore = false;
    (async () => {
      const res = await getCountries(); // fetch ALL once
      if (!ignore && res.success) setCountries(res.returnedData);
    })();
    return () => { ignore = true; };
  }, []); // ⬅ only once

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

  const selectedCode = (watch("org.country_code") || "").toUpperCase();
  const selectedCountry = useMemo(
    () => countries.find((c) => c.code.toUpperCase() === selectedCode),
    [countries, selectedCode]
  );
useEffect(() => {
  if (!selectedCode || !countries.length) return;
  const item = countries.find(c => c.code.toUpperCase() === selectedCode);
  if (item) {
    setCountryQuery(
      `${item.name} (${selectedCode})${item.dial_code ? ` — ${item.dial_code}` : ""}`
    );
  }
}, [countries, selectedCode]);

  const createContact = watch("createContact");

  const onSubmit = async (values: FormOutput) => {
    const cc = (values.org.country_code || "").toUpperCase();

    const payloadOrg = {
      name: values.org.name,
      country_code: cc || undefined,
      address: values.org.address || undefined,
      tax_id: values.org.tax_id || undefined,
      phone: values.org.phone || undefined,
      status: values.org.status as ClientStatus,
    };

    if (isCreate) {
      const payload = {
        ...payloadOrg,
        ...(values.createContact
          ? {
            contact_person: {
              first_name: values.contact.first_name.trim(),
              last_name: values.contact.last_name.trim(),
              email: values.contact.email.trim(),
              username: values.contact.username.trim() || undefined,
              password: values.contact.password.trim() || undefined,
            },
          }
          : {}),
      };

      const res = await createClient(payload);
      if (res.success) {
        const tmp = res.returnedData.temp_password;
        if (values.createContact && tmp) {
          toast?.(Client created. Contact login created. Temp password: ${tmp}, "success");
        } else {
          toast?.("Client created.", "success");
        }
        onSuccess?.(res.returnedData);
        onClose?.();
      } else {
        toast?.(res.error || "Failed to create client.", "danger");
      }
      return;
    }

    // EDIT
    const contactPatch = hasEditableContact && values.contactEdit
      ? {
        first_name: values.contactEdit.first_name.trim(),
        last_name: values.contactEdit.last_name.trim(),
        email: values.contactEdit.email.trim(),
        username: values.contactEdit.username.trim() || undefined,
      }
      : undefined;

    const updatePayload = {
      ...payloadOrg,
      ...(contactPatch ? { contact_person: contactPatch } : {}),
    };

    const res = await updateClient(initial!.id!, updatePayload);
    if (res.success) {
      toast?.("Client updated.", "success");
      onSuccess?.(res.returnedData);
      onClose?.();
    } else {
      toast?.(res.error || "Failed to update client.", "danger");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Company basics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Company name"
          {...register("org.name")}
          isInvalid={!!errors.org?.name}
          errorMessage={errors.org?.name?.message}
        />
        {/* Country select (ISO-2) */}
        <div className="space-y-2">
          <Autocomplete
  label="Country"
  items={filtered}                     // your filtered memo (by name/code/dial)
  selectedKey={selectedCode || null}
  inputValue={countryQuery}
  onInputChange={setCountryQuery}
  menuTrigger="input"
  allowsCustomValue={false}

  // tame Chrome’s saved suggestions
  autoComplete="off"
  name="country_autocomplete"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck="false"

  listboxProps={{ emptyContent: "No matching countries" }}
  popoverProps={{ placement: "bottom", offset: 8 }}
  onSelectionChange={(key) => {
    const code = (key ?? "").toString().toUpperCase();
    const item = countries.find(c => c.code.toUpperCase() === code);

    // update form value
    setValue("org.country_code", code, { shouldValidate: true });

    // update visible text to the chosen label
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
      textValue={${item.name} ${item.code} ${item.dial_code ?? ""}}
    >
      {item.name} ({item.code.toUpperCase()})
      {item.dial_code ? ` — ${item.dial_code}` : ""}
    </AutocompleteItem>
  )}
</Autocomplete>


          {errors.org?.country_code && (
            <p className="text-danger text-sm">{String(errors.org.country_code.message)}</p>
          )}
        </div>

        <Input label="Tax ID" {...register("org.tax_id")} />
        {/* Phone with optional dial prefix preview */}
        <Input
          label={selectedCountry?.dial_code ? Phone (prefix ${selectedCountry.dial_code}) : "Phone"}
          {...register("org.phone")}
        />
      </div>

      <Textarea label="Address" {...register("org.address")} />

      {/* Status */}
      <Controller
        control={control}
        name="org.status"
        render={({ field }) => (
          <Select
            label="Status"
            selectionMode="single"
            selectedKeys={field.value ? [field.value] : ["active"]}
            onSelectionChange={(keys) => {
              if (keys === "all") return;
              field.onChange(Array.from(keys)[0] as ClientStatus);
            }}
          >
            {statusOptions.map((o) => (
              <SelectItem key={o.value}>{o.label}</SelectItem>
            ))}
          </Select>
        )}
      />
      {errors.org?.status && (
        <p className="text-danger text-sm">{String(errors.org.status.message)}</p>
      )}

      {/* Contact creation (CREATE ONLY) */}
      {(!hasEditableContact && !initial?.id) && (
        <>
          <Divider />
          <div className="flex items-center justify-between">
            <p className="font-medium">Create contact login</p>
            <Controller
              control={control}
              name="createContact"
              render={({ field }) => (
                <Switch isSelected={field.value} onValueChange={field.onChange}>
                  Enable
                </Switch>
              )}
            />
          </div>

          {createContact && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First name"
                {...register("contact.first_name")}
                isInvalid={!!errors.contact?.first_name}
                errorMessage={errors.contact?.first_name?.message}
              />
              <Input
                label="Last name"
                {...register("contact.last_name")}
                isInvalid={!!errors.contact?.last_name}
                errorMessage={errors.contact?.last_name?.message}
              />
              <Input
                label="Email"
                type="email"
                {...register("contact.email")}
                isInvalid={!!errors.contact?.email}
                errorMessage={errors.contact?.email?.message}
              />
              <Input label="Username (optional)" {...register("contact.username")} />
              <Input
                label="Password (optional — will auto-generate if empty)"
                type="password"
                {...register("contact.password")}
              />
            </div>
          )}
        </>
      )}

      {/* Contact editing (EDIT ONLY) */}
      {hasEditableContact && (
        <>
          <Divider />
          <p className="font-medium">Contact details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First name"
              {...register("contactEdit.first_name")}
              isInvalid={!!errors.contactEdit?.first_name}
              errorMessage={errors.contactEdit?.first_name && String(errors.contactEdit.first_name.message)}
            />
            <Input
              label="Last name"
              {...register("contactEdit.last_name")}
              isInvalid={!!errors.contactEdit?.last_name}
              errorMessage={errors.contactEdit?.last_name && String(errors.contactEdit.last_name.message)}
            />
            <Input
              label="Email"
              type="email"
              {...register("contactEdit.email")}
              isInvalid={!!errors.contactEdit?.email}
              errorMessage={errors.contactEdit?.email && String(errors.contactEdit.email.message)}
            />
            <Input
              label="Username (optional)"
              {...register("contactEdit.username")}
            />
          </div>
          <p className="text-xs text-foreground-500">
            To change the password, use the <b>Reset password</b> action in the client details page.
          </p>
        </>
      )}

      <div className="flex justify-end">
        <Button type="submit" color="primary" isLoading={isSubmitting} className="text-white">
          {buttonLabel}
        </Button>
      </div>
    </form>
  );
}