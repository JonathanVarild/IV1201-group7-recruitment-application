import ApplicationBoard from "./ApplicationBoard";
import { ApplicationFullInformation } from "@/lib/types/applicationType";
import mockData from "./mockData.json";
import { useTranslations } from "next-intl";

const AdminPage = () => {
  {
    /* TODO: FETCH DATA FROM DATABASE HERE */
  }
  const mockApplications: ApplicationFullInformation[] = mockData as ApplicationFullInformation[];

  const t = useTranslations("AdminPage");

  return (
    <div className="min-w-4xl mx-auto">
      <h1 className="text-3xl font-bold my-6 text-center">{t("title")}</h1>
      <div className="flex justify-center items-center">
        <ApplicationBoard applications={mockApplications} />
      </div>
    </div>
  );
};

export default AdminPage;
