import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import ApplicationCard from "./ApplicationCard";
import { ApplicationCardSummary } from "@/lib/types/applicationType";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ApplicationBoardProps {
  applications: ApplicationCardSummary[];
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
  return (
    <div className="flex gap-4 p-4 h-full overflow-x-auto">
      {columns.map((column) => {
        const columnApplications = applications.filter((app) => app.status === column.status);

        return (
          <div key={column.id} className="w-80 flex flex-col">
            <Card className="flex flex-col h-full overflow-visible">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{t(column.id as "unhandled" | "accepted" | "rejected")}</CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    {columnApplications.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-2">
                <div className="space-y-2 px-4 py-2">
                  {columnApplications.map((app) => (
                    <ApplicationCard key={app.id} application={app} />
                  ))}
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
