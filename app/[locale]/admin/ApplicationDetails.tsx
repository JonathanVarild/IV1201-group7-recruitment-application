import { useTranslations } from "next-intl";
import { ApplicationFullInformation } from "@/lib/types/applicationType";

interface ApplicationDetailsProps {
  applicationDetails: ApplicationFullInformation;
}

const ApplicationDetails = ({ applicationDetails }: ApplicationDetailsProps) => {
  const t = useTranslations("AdminPage.applicationDetails");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-sm text-muted-foreground">{t("email")}</p>
            <p className="font-medium">{applicationDetails.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-sm text-muted-foreground">{t("applicationDate")}</p>
            <p className="font-medium">{applicationDetails.applicationDate}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("status")}</p>
            <p className="font-medium capitalize">{applicationDetails.status}</p>
          </div>
        </div>
      </div>

      {applicationDetails.answers && applicationDetails.answers.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3">{t("answersHeader")}</h4>
          <div className="space-y-4">
            {applicationDetails.answers.map((questionAndAnswer, index) => (
              <div key={index} className="border-l-2 border-gray-200 pl-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("question")}: {t(`questionsToAnswer.${questionAndAnswer.question}`)}
                </p>
                <p className="text-sm">{questionAndAnswer.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetails;
