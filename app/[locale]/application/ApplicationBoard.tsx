"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ApplicationCard from "./ApplicationCard";
import { ApplicationFullInformation } from "@/lib/types/applicationType";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ApplicationBoardProps {
  applications: ApplicationFullInformation[];
}

interface Column {
  id: string;
  status: string;
}

const columns: Column[] = [
  { id: "unhandled", status: "unhandled" },
  { id: "accepted", status: "accepted" },
  { id: "rejected", status: "rejected" },
];

/**
 *  ApplicationBoard component that displays a kanban-style board of applications categorized by their status.
 *
 * @param applications An array of applications to be displayed on the kanban board.
 * @returns {JSX.Element} The rendered application board component.
 */
const ApplicationBoard = ({ applications }: ApplicationBoardProps) => {
  const t = useTranslations("AdminPage.boardColumns");
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({
    unhandled: 5,
    accepted: 5,
    rejected: 5,
  });

  const loadMore = (columnId: string) => {
    setVisibleCounts((prev) => ({ ...prev, [columnId]: prev[columnId] + 5 }));
  };

  return (
    <div className="flex gap-4 p-4 h-full overflow-x-auto">
      {columns.map((column) => {
        const columnApplications = applications.filter((app) => app.status === column.status);
        const visibleCount = visibleCounts[column.id];
        const hasMore = columnApplications.length > visibleCount;

        return (
          <div key={column.id} className="w-80 flex flex-col h-147">
            <Card className="flex flex-col h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{t(column.id as "unhandled" | "accepted" | "rejected")}</CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    {columnApplications.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-2 min-h-0">
                <div className="space-y-3 px-4">
                  {columnApplications.length === 0 ? (
                    <p className="text-muted-foreground">{t("noApplications")}</p>
                  ) : (
                    <>
                      {columnApplications.slice(0, visibleCount).map((app) => (
                        <ApplicationCard key={app.id} applicationFullInformation={app} />
                      ))}
                      {hasMore && (
                        <Button variant="default" className="w-full mt-2 hover:scale-105 transition-transform" onClick={() => loadMore(column.id)}>
                          {t("loadMore")} →
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

export default ApplicationBoard;
