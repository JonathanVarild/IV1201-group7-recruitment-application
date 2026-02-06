"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ApplicationFullInformation } from "@/lib/types/applicationType";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ApplicationDetails from "./ApplicationDetails";

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
  const { name, applicationDate } = applicationFullInformation;
  const [open, setOpen] = useState(false);

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
        </DialogHeader>
        <ApplicationDetails applicationDetails={applicationFullInformation} />
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationCard;
