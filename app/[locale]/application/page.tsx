import ApplicationBoard from "./ApplicationBoard";
import { getTranslations } from "next-intl/server";
import { getApplications } from "@/server/services/applicationService";
import { ApplicationFullInformation } from "@/lib/types/applicationType";

/**
 * Display the admin page for applications.
 *
 * @returns {JSX.Element} The rendered admin page component.
 */
const AdminPage = async () => {
  let applications: ApplicationFullInformation[] = [];

  const t = await getTranslations("AdminPage");
  const tDetails = await getTranslations("AdminPage.applicationDetails");

  try {
    applications = await getApplications({
      noCompetencesText: tDetails("noCompetences"),
      noAvailabilityText: tDetails("noAvailability"),
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
  }

  return (
    <div className="min-w-4xl mx-auto">
      <h1 className="text-3xl font-bold my-6 text-center">{t("title")}</h1>
      <div className="flex justify-center items-center">
        <ApplicationBoard applications={applications} />
      </div>
    </div>
  );
};

export default AdminPage;
