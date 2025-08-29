"use client";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import PageCard from "../../components/PageCard";
import JobForm from "../../components/jobs/JobForm";

export default function JobCreatePage() {
  const navigate = useNavigate();
  return (
    <div className="p-4 md:p-6">
      <PageCard
        title={
          <div className="flex items-center gap-3">
            <Button as={Link} to="/jobs" size="sm" variant="light" startContent={<Icon icon="lucide:arrow-left" />}>
              Back
            </Button>
            <span className="text-xl md:text-2xl font-semibold">Add New Job Opening</span>
          </div>
        }
      >
        <div className="max-w-3xl">
          <JobForm
            mode="create"
            onSuccess={() => navigate("/jobs")}
            onDone={() => navigate("/jobs")}
          />
        </div>
      </PageCard>
    </div>
  );
}
