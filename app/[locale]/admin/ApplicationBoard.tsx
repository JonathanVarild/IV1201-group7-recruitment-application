"use client";

import { useEffect, useState } from "react";
import { managedFetch } from "@/lib/api";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ApplicationCard from "./ApplicationCard";
import { ApplicationFullInformation } from "@/lib/types/applicationType";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ApplicationBoardProps {
  initialData: Record<ColumnId, PaginatedColumnData>;
}

type ColumnId = "unhandled" | "accepted" | "rejected";

interface PaginatedColumnData {
  applications: ApplicationFullInformation[];
  total: number;
  hasMore: boolean;
}

interface Column {
  id: ColumnId;
  status: ColumnId;
}

interface ColumnState extends PaginatedColumnData {
  isLoading: boolean;
}

const columns: Column[] = [
  { id: "unhandled", status: "unhandled" },
  { id: "accepted", status: "accepted" },
  { id: "rejected", status: "rejected" },
];

const createColumnState = (data: Record<ColumnId, PaginatedColumnData>): Record<ColumnId, ColumnState> => ({
  unhandled: { ...data.unhandled, isLoading: false },
  accepted: { ...data.accepted, isLoading: false },
  rejected: { ...data.rejected, isLoading: false },
});

/**
 *  ApplicationBoard component that displays a kanban-style board of applications categorized by their status.
 *
 * @param applications An array of applications to be displayed on the kanban board.
 * @returns {JSX.Element} The rendered application board component.
 */
const ApplicationBoard = ({ initialData }: ApplicationBoardProps) => {
  const t = useTranslations("AdminPage.boardColumns");
  const tDetails = useTranslations("AdminPage.applicationDetails");

  const [columnState, setColumnState] = useState<Record<ColumnId, ColumnState>>(createColumnState(initialData));

  useEffect(() => {
    setColumnState(createColumnState(initialData));
  }, [initialData]);

  const loadMore = async (columnId: ColumnId) => {
    const currentColumn = columnState[columnId];
    if (currentColumn.isLoading || !currentColumn.hasMore) {
      return;
    }

    setColumnState((prev) => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        isLoading: true,
      },
    }));

    try {
      const query = new URLSearchParams({
        status: columnId,
        offset: String(currentColumn.applications.length),
        noCompetencesText: tDetails("noCompetences"),
        noAvailabilityText: tDetails("noAvailability"),
      });

      const response = await managedFetch<PaginatedColumnData>(`/api/admin?${query.toString()}`, {
        method: "GET",
      });

      setColumnState((prev) => ({
        ...prev,
        [columnId]: {
          applications: [...prev[columnId].applications, ...response.applications],
          total: response.total,
          hasMore: response.hasMore,
          isLoading: false,
        },
      }));
    } catch (error) {
      console.error("Error loading more applications:", error);
      setColumnState((prev) => ({
        ...prev,
        [columnId]: {
          ...prev[columnId],
          isLoading: false,
        },
      }));
    }
  };

  return (
    <div className="flex gap-4 p-4 h-full overflow-x-auto">
      {columns.map((column) => {
        const currentColumn = columnState[column.id];
        const columnApplications = currentColumn.applications;
        const hasMore = currentColumn.hasMore;

        return (
          <div key={column.id} className="w-80 flex flex-col h-147">
            <Card className="flex flex-col h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{t(column.id as "unhandled" | "accepted" | "rejected")}</CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    {currentColumn.total}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-2 min-h-0">
                <div className="space-y-3 px-4">
                  {columnApplications.length === 0 ? (
                    <p className="text-muted-foreground">{t("noApplications")}</p>
                  ) : (
                    <>
                      {columnApplications.map((app) => (
                        <ApplicationCard key={app.id} applicationFullInformation={app} />
                      ))}
                      {hasMore && (
                        <Button
                          variant="default"
                          className="w-full mt-2 hover:scale-105 transition-transform"
                          onClick={() => loadMore(column.id)}
                          disabled={currentColumn.isLoading}
                        >
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
