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
export default function DashboardJobs({ jobs }: DashboardJobsProps) {
  const totalJobs =
    jobs.open +
    jobs.inProgress +
    jobs.disputed +
    jobs.completed +
    jobs.cancelled;
  const activeJobs = jobs.open + jobs.inProgress;
  return (
    <AdminSection
      title="Jobs"
      description="Current job lifecycle and workload across the platform."
    >
      {" "}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {" "}
        <AdminStatCard
          title="Total Jobs"
          value={totalJobs.toLocaleString()}
          subtitle="All recorded jobs"
          accent="blue"
        />{" "}
        <AdminStatCard
          title="Active Workload"
          value={activeJobs.toLocaleString()}
          subtitle={`${jobs.open.toLocaleString()} open · ${jobs.inProgress.toLocaleString()} in progress`}
          accent="purple"
        />{" "}
        <AdminStatCard
          title="Disputed"
          value={jobs.disputed.toLocaleString()}
          subtitle="Require administrative attention"
          accent={jobs.disputed > 0 ? "amber" : "green"}
        />{" "}
        <AdminStatCard
          title="Completed"
          value={jobs.completed.toLocaleString()}
          subtitle="Successfully finished"
          accent="green"
        />{" "}
      </div>{" "}
      <div className="mt-6 border-t border-[#E4ECF7] pt-6 dark:border-[#2D3F55]">
        {" "}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <span className="h-2.5 w-2.5 rounded-full bg-[#5B8FCC]" />{" "}
            <div>
              {" "}
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                {" "}
                Open{" "}
              </p>{" "}
              <p className="mt-0.5 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {" "}
                {jobs.open.toLocaleString()}{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center gap-3">
            {" "}
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />{" "}
            <div>
              {" "}
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                {" "}
                In Progress{" "}
              </p>{" "}
              <p className="mt-0.5 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {" "}
                {jobs.inProgress.toLocaleString()}{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center gap-3">
            {" "}
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />{" "}
            <div>
              {" "}
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                {" "}
                Cancelled{" "}
              </p>{" "}
              <p className="mt-0.5 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {" "}
                {jobs.cancelled.toLocaleString()}{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </AdminSection>
  );
}
