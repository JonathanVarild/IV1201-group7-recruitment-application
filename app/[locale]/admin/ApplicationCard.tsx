import { useTranslations } from "next-intl";
import { ApplicationCardSummary } from "@/lib/types/applicationType";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ApplicationCardProps {
  application: ApplicationCardSummary;
}

/**
 * ApplicationCard component displays individual application details.
 *
 * @param {ApplicationCardProps} application The properties for the application card.
 * @returns {JSX.Element} The rendered application card component.
 */
const ApplicationCard = ({ application }: ApplicationCardProps) => {
  const t = useTranslations("AdminPage.applicationCard");
  const { name, applicationDate } = application;
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow py-3">
      <CardContent>
        <CardTitle className="text-base font-medium pb-1">{name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("appliedDate")}: {applicationDate}
        </p>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;
