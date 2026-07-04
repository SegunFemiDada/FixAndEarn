"use client";

import * as React from "react";

import AdminSection from "@/components/admin/AdminSection";
import AdminStatCard from "@/components/admin/AdminStatCard";

type DashboardJobsProps = {
  jobs: {
    open: number;
    inProgress: number;
    disputed: number;
    completed: number;
    cancelled: number;
  };
};

export default function DashboardJobs({
  jobs,
}: DashboardJobsProps) {
  const totalJobs =
    jobs.open +
    jobs.inProgress +
    jobs.disputed +
    jobs.completed +
    jobs.cancelled;

  return (
    <AdminSection
      title="Jobs"
      description="Monitor the current lifecycle of all jobs across the platform."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          title="Total Jobs"
          value={totalJobs.toLocaleString()}
          subtitle="All recorded jobs"
          accent="blue"
        />

        <AdminStatCard
          title="Open"
          value={jobs.open.toLocaleString()}
          subtitle="Waiting for fixer applications"
          accent="green"
        />

        <AdminStatCard
          title="In Progress"
          value={jobs.inProgress.toLocaleString()}
          subtitle="Currently active jobs"
          accent="purple"
        />

        <AdminStatCard
          title="Disputed"
          value={jobs.disputed.toLocaleString()}
          subtitle="Require administrative attention"
          accent="amber"
        />

        <AdminStatCard
          title="Completed"
          value={jobs.completed.toLocaleString()}
          subtitle="Successfully finished"
          accent="green"
        />

        <AdminStatCard
          title="Cancelled"
          value={jobs.cancelled.toLocaleString()}
          subtitle="Closed without completion"
          accent="red"
        />
      </div>
    </AdminSection>
  );
}