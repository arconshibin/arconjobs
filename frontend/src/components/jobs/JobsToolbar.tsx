// src/components/jobs/JobsToolbar.tsx
"use client";

import {
  Button,
  ButtonGroup,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Kbd,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMemo } from "react";

type Props = {
  count: number;
  loading?: boolean;

  // controlled fields
  titleQ: string;
  setTitleQ: (v: string) => void;

  status: "" | "active" | "inactive";
  setStatus: (v: "" | "active" | "inactive") => void;

  // admin-only org search (can just be a string)
  isAdmin?: boolean;
  orgQ: string;
  setOrgQ: (v: string) => void;

  ordering: "new" | "old" | "title";
  setOrdering: (v: "new" | "old" | "title") => void;

  onApply: () => void;
  onClear?: () => void;
};

export default function JobsToolbar({
  count,
  loading,
  titleQ,
  setTitleQ,
  status,
  setStatus,
  isAdmin,
  orgQ,
  setOrgQ,
  ordering,
  setOrdering,
  onApply,
  onClear,
}: Props) {
  const sortLabel = useMemo(() => {
    switch (ordering) {
      case "old": return "Oldest";
      case "title": return "Title A–Z";
      default: return "Newest";
    }
  }, [ordering]);

  return (
    <div className="rounded-2xl border border-divider bg-content1 p-4 md:p-5">
      {/* Top row: count + sort */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="text-lg font-semibold">{count.toLocaleString()} Jobs Found</div>

        <div className="flex items-center gap-2">
          <span className="text-foreground-500 text-sm">Sort by:</span>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="flat" endContent={<Icon icon="lucide:chevron-down" />}>
                {sortLabel}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Sort jobs"
              selectedKeys={new Set([ordering])}
              selectionMode="single"
              onSelectionChange={(keys) => {
                const key = Array.from(keys as Set<string>)[0] as "new" | "old" | "title";
                setOrdering(key);
                onApply();
              }}
            >
              <DropdownItem key="new" startContent={<Icon icon="lucide:clock-9" />}>Newest</DropdownItem>
              <DropdownItem key="old" startContent={<Icon icon="lucide:clock" />}>Oldest</DropdownItem>
              <DropdownItem key="title" startContent={<Icon icon="lucide:case-sensitive" />}>Title A–Z</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Bottom row: search + filters */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            value={titleQ}
            onValueChange={setTitleQ}
            placeholder="Search jobs by title…"
            className="w-full"
            startContent={<Icon icon="lucide:search" className="text-foreground-500" />}
            endContent={<Kbd className="hidden md:inline-flex">/</Kbd>}
          />
          {isAdmin && (
            <Input
              value={orgQ}
              onValueChange={setOrgQ}
              placeholder="Search by client (organization)…"
              className="w-full"
              startContent={<Icon icon="lucide:building-2" className="text-foreground-500" />}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <ButtonGroup radius="full" variant="flat">
            <Button
              onPress={() => setStatus("")}
              className={status === "" ? "bg-primary/20 text-primary-600" : ""}
              startContent={<Icon icon="lucide:list-filter" />}
            >
              All
            </Button>
            <Button
              onPress={() => setStatus("active")}
              className={status === "active" ? "bg-primary/20 text-primary-600" : ""}
              startContent={<Icon icon="lucide:check-circle-2" />}
            >
              Active
            </Button>
            <Button
              onPress={() => setStatus("inactive")}
              className={status === "inactive" ? "bg-primary/20 text-primary-600" : ""}
              startContent={<Icon icon="lucide:pause-circle" />}
            >
              Inactive
            </Button>
          </ButtonGroup>

          <Button onPress={onApply} isLoading={!!loading} color="primary" className="text-white">
            <Icon icon="lucide:filter" className="mr-1" /> Apply
          </Button>
          <Button
            variant="light"
            onPress={() => {
              setTitleQ("");
              setOrgQ("");
              setStatus("");
              setOrdering("new");
              onClear?.();
              onApply();
            }}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
