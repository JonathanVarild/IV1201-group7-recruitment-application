"use client";

import { useState } from "react";
import { managedFetch } from "@/lib/api";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { APIError } from "@/lib/errors/generalErrors";
import ApplicationDetails from "./ApplicationDetails";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ApplicationFullInformation } from "@/lib/types/applicationType";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ApplicationCardProps {
  applicationFullInformation: ApplicationFullInformation;
}

/**
 * ApplicationCard component displays individual application details.
 *
 * @param {ApplicationCardProps} applicationFullInformation The full application information.
 * @returns {JSX.Element} The rendered application card component.
 */
const ApplicationCard = ({ applicationFullInformation }: ApplicationCardProps) => {
  const t = useTranslations("AdminPage.applicationCard");
  const tDetails = useTranslations("AdminPage.applicationDetails");
  const tColumns = useTranslations("AdminPage.boardColumns");
  const router = useRouter();
  const { id, name, applicationDate, status } = applicationFullInformation;
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const allStatuses = ["unhandled", "accepted", "rejected"];
  const otherStatuses = allStatuses.filter((s) => s !== status);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await managedFetch(`/api/application/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus, currentStatus: status }),
      });

      setOpen(false);
      router.refresh();
    } catch (error) {
      // Check if it's a 409 Conflict error
      if (error instanceof APIError && error.statusCode === 409) {
        alert(t("statusChanged"));
        router.refresh(); // Refresh to get the latest data
      } else {
        alert(t("updateError"));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getButtonStyle = (statusType: string) => {
    switch (statusType) {
      case "accepted":
        return "bg-green-700 hover:bg-green-800 text-white";
      case "rejected":
        return "bg-red-700 hover:bg-red-800 text-white";
      case "unhandled":
        return "bg-white hover:bg-gray-50 text-gray-900 border border-gray-300";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow py-3">
          <CardContent>
            <CardTitle className="text-base font-medium pb-1">{`${name.firstName} ${name.lastName}`}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("appliedDate")}: {applicationDate}
            </p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{`${name.firstName} ${name.lastName}`}</DialogTitle>
          <DialogDescription>{tDetails("dialogDescription")}</DialogDescription>
        </DialogHeader>
        <ApplicationDetails applicationDetails={applicationFullInformation} />
        <div className="flex justify-end gap-2 mt-4">
          <Button className={getButtonStyle(otherStatuses[0])} onClick={() => handleStatusChange(otherStatuses[0])} disabled={isUpdating}>
            {tColumns(otherStatuses[0] as "unhandled" | "accepted" | "rejected")}
          </Button>
          <Button className={getButtonStyle(otherStatuses[1])} onClick={() => handleStatusChange(otherStatuses[1])} disabled={isUpdating}>
            {tColumns(otherStatuses[1] as "unhandled" | "accepted" | "rejected")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationCard;
