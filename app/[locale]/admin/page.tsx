import ApplicationBoard from "./ApplicationBoard";
import { getTranslations } from "next-intl/server";
import { ApplicationStatus, getApplicationsByStatus, PaginatedApplicationsResult } from "@/server/services/applicationService";

/**
 * TODO: Implement recruiter authentication on this page
 */

const STATUSES: ApplicationStatus[] = ["unhandled", "accepted", "rejected"];

/**
 * Display the admin page for applications.
 *
 * @returns {JSX.Element} The rendered admin page component.
 */
const AdminPage = async () => {
  let initialData: Record<ApplicationStatus, PaginatedApplicationsResult> = {
    unhandled: { applications: [], total: 0, hasMore: false },
    accepted: { applications: [], total: 0, hasMore: false },
    rejected: { applications: [], total: 0, hasMore: false },
  };

  const t = await getTranslations("AdminPage");
  const tDetails = await getTranslations("AdminPage.applicationDetails");

  try {
    const options = {
      noCompetencesText: tDetails("noCompetences"),
      noAvailabilityText: tDetails("noAvailability"),
    };

    const [unhandled, accepted, rejected] = await Promise.all(STATUSES.map((status) => getApplicationsByStatus(options, status, 5, 0)));

    initialData = {
      unhandled,
      accepted,
      rejected,
    };
  } catch (error) {
    alert(t("errors.fetchApplications"));
  }

  return (
    <div className="min-w-4xl mx-auto">
      <h1 className="text-3xl font-bold my-6 text-center">{t("title")}</h1>
      <div className="flex justify-center items-center">
        <ApplicationBoard initialData={initialData} />
      </div>
    </div>
  );
};

export default AdminPage;
