"use client";

import { type FocusEvent, useCallback, useEffect, useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import { z } from "zod";
import { AuthStatus } from "@/components/AuthProvider";
import { managedFetch } from "@/lib/api";
import { APIError } from "@/lib/errors/generalErrors";

const applicationStatusSchema = z.enum(["unhandled", "accepted", "rejected"]);

const submittedApplicationSchema = z.object({
  status: applicationStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

const getApplicationResponseSchema = z.object({
  application: submittedApplicationSchema.nullable(),
});

const fullUserDataSchema = z.object({
  id: z.coerce.number().int().nonnegative(),
  username: z.string(),
  roleID: z.coerce.number().int().nonnegative(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  pnr: z.string(),
});

const competenceSchema = z.object({
  id: z.coerce.number().int().nonnegative(),
  name: z.string(),
});

const userCompetenceSchema = competenceSchema.extend({
  yearsOfExperience: z.coerce.number().nonnegative(),
  competenceProfileID: z.coerce.number().int().nonnegative(),
});

const userAvailabilityResponseSchema = z.object({
  availabilityID: z.coerce.number().int().nonnegative(),
  fromDate: z.string(),
  toDate: z.string(),
});

const getUserDetailsResponseSchema = z.object({
  userData: fullUserDataSchema,
  availability: z.array(userAvailabilityResponseSchema),
  competences: z.array(userCompetenceSchema),
});

const getCompetenceListResponseSchema = z.array(competenceSchema);

const addUserAvailabilityResponseSchema = z.object({
  availabilityID: z.coerce.number().int().nonnegative(),
});

const setCompetenceInputSchema = z.object({
  competenceID: z.number().int().nonnegative(),
  yearsOfExperience: z.coerce.number().gt(0),
});

type AvailabilityRange = {
  from: Date;
  to: Date;
  availabilityID?: number;
};

type CompetenceEntry = {
  competenceID: number;
  yearsOfExperience: number;
  competenceProfileID?: number;
};

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

type SubmittedApplication = z.infer<typeof submittedApplicationSchema>;

type FullUserData = z.infer<typeof fullUserDataSchema>;

type Competence = z.infer<typeof competenceSchema>;

type UseApplyPageDataOptions = {
  locale: string;
  status: AuthStatus;
  onUnauthorized: () => void;
  messages: {
    competenceInvalidInput: string;
    availabilityInvalidInput: string;
    loadingError: string;
  };
};

type LoadOptions = {
  skipLoadingState?: boolean;
  isActive?: () => boolean;
};

const normalizeId = (value: number | string | null | undefined) => {
  if (value == null) return undefined;
  const numberValue = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fetchWithSchema = async <TSchema extends z.ZodTypeAny>(url: string, options: RequestInit, schema: TSchema): Promise<z.infer<TSchema>> => {
  const response = await managedFetch<unknown>(url, options);
  return schema.parse(response);
};

export const useApplyPageData = ({ locale, status, onUnauthorized, messages }: UseApplyPageDataOptions) => {
  const [userData, setUserData] = useState<FullUserData | null>(null);
  const [availableCompetences, setAvailableCompetences] = useState<Competence[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isSavingCompetence, setIsSavingCompetence] = useState(false);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState<SubmittedApplication | null>(null);

  const [selectedCompetenceID, setSelectedCompetenceID] = useState<number | null>(null);
  const [yearsInput, setYearsInput] = useState("");
  const [addedCompetences, setAddedCompetences] = useState<CompetenceEntry[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<DateRange | undefined>(undefined);
  const [availabilityRanges, setAvailabilityRanges] = useState<AvailabilityRange[]>([]);
  const showErrorAlert = (message: string) => {
    alert(message);
  };

  const loadApplicationData = useCallback(
    async (options?: LoadOptions) => {
      const isActive = options?.isActive ?? (() => true);
      let hasShownLoadErrorAlert = false;
      const showLoadError = () => {
        if (hasShownLoadErrorAlert) {
          return;
        }
        hasShownLoadErrorAlert = true;
        showErrorAlert(messages.loadingError);
      };
      if (status !== AuthStatus.Authenticated || !isActive()) {
        return;
      }

      if (!options?.skipLoadingState) {
        setIsLoadingData(true);
      }
      setHasLoadError(false);

      try {
        const applicationResult = await fetchWithSchema("/api/application/getApplication", { method: "POST" }, getApplicationResponseSchema);

        if (!isActive()) {
          return;
        }

        setSubmittedApplication(applicationResult.application);

        if (applicationResult.application != null) {
          return;
        }

        const [detailsResult, competenceListResult] = await Promise.allSettled([
          fetchWithSchema("/api/application/getUserDetails", { method: "POST" }, getUserDetailsResponseSchema),
          fetchWithSchema(
            "/api/application/getCompetenceList",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ locale: locale.split("-")[0] }),
            },
            getCompetenceListResponseSchema,
          ),
        ]);

        if (!isActive()) {
          return;
        }

        if (detailsResult.status === "fulfilled") {
          const details = detailsResult.value;
          setUserData(details.userData);
          setAddedCompetences(
            details.competences.map((competence) => ({
              competenceID: competence.id,
              yearsOfExperience: competence.yearsOfExperience,
              competenceProfileID: normalizeId(competence.competenceProfileID),
            })),
          );
          setAvailabilityRanges(
            details.availability.map((availability) => ({
              from: new Date(availability.fromDate),
              to: new Date(availability.toDate),
              availabilityID: normalizeId(availability.availabilityID),
            })),
          );
        } else if (detailsResult.reason instanceof APIError && detailsResult.reason.statusCode === 401) {
          onUnauthorized();
        } else {
          console.error("Failed to load user details:", detailsResult.reason);
          setHasLoadError(true);
          showLoadError();
        }

        if (competenceListResult.status === "fulfilled") {
          setAvailableCompetences(competenceListResult.value);
        } else if (competenceListResult.reason instanceof APIError && competenceListResult.reason.statusCode === 401) {
          onUnauthorized();
        } else {
          console.error("Failed to load competence list:", competenceListResult.reason);
          setHasLoadError(true);
          showLoadError();
        }
      } catch (error) {
        if (!isActive()) {
          return;
        }

        if (error instanceof APIError && error.statusCode === 401) {
          onUnauthorized();
          return;
        }

        console.error("Failed to load application data:", error);
        setHasLoadError(true);
        showLoadError();
      } finally {
        if (!options?.skipLoadingState && isActive()) {
          setIsLoadingData(false);
        }
      }
    },
    [locale, messages.loadingError, onUnauthorized, status],
  );

  useEffect(() => {
    if (status !== AuthStatus.Authenticated) {
      return;
    }

    let active = true;
    void loadApplicationData({ isActive: () => active });

    return () => {
      active = false;
    };
  }, [loadApplicationData, status]);

  const addCompetence = async () => {
    if (isSavingCompetence) {
      return;
    }

    const result = setCompetenceInputSchema.safeParse({
      competenceID: selectedCompetenceID,
      yearsOfExperience: yearsInput,
    });

    if (!result.success) {
      showErrorAlert(messages.competenceInvalidInput);
      return;
    }

    setIsSavingCompetence(true);

    try {
      await managedFetch("/api/application/setUserCompetence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      setSelectedCompetenceID(null);
      setYearsInput("");
      await loadApplicationData({ skipLoadingState: true });
    } catch (error) {
      if (error instanceof APIError && error.statusCode === 401) {
        onUnauthorized();
        return;
      }

      console.error("Failed to persist added competence:", error);
      showErrorAlert(messages.loadingError);
    } finally {
      setIsSavingCompetence(false);
    }
  };

  const removeCompetence = async (indexToRemove: number) => {
    if (isSavingCompetence) {
      return;
    }

    const targetCompetence = addedCompetences[indexToRemove];
    const competenceProfileID = normalizeId(targetCompetence?.competenceProfileID);

    if (targetCompetence == null) {
      return;
    }

    if (competenceProfileID == null) {
      showErrorAlert(messages.loadingError);
      return;
    }

    setIsSavingCompetence(true);

    try {
      await managedFetch("/api/application/deleteUserCompetence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competenceProfileID }),
      });

      await loadApplicationData({ skipLoadingState: true });
    } catch (error) {
      if (error instanceof APIError && error.statusCode === 401) {
        onUnauthorized();
        return;
      }

      console.error("Failed to delete competence:", error);
      showErrorAlert(messages.loadingError);
    } finally {
      setIsSavingCompetence(false);
    }
  };

  const persistCompetenceYears = async (indexToPersist: number) => {
    if (isSavingCompetence) {
      return;
    }

    const targetCompetence = addedCompetences[indexToPersist];
    if (targetCompetence == null) {
      return;
    }

    const result = setCompetenceInputSchema.safeParse({
      competenceID: targetCompetence.competenceID,
      yearsOfExperience: targetCompetence.yearsOfExperience,
    });

    if (!result.success) {
      showErrorAlert(messages.competenceInvalidInput);
      return;
    }

    setIsSavingCompetence(true);

    try {
      await managedFetch("/api/application/setUserCompetence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      await loadApplicationData({ skipLoadingState: true });
    } catch (error) {
      if (error instanceof APIError && error.statusCode === 401) {
        onUnauthorized();
        return;
      }

      console.error("Failed to persist competence years:", error);
      showErrorAlert(messages.loadingError);
    } finally {
      setIsSavingCompetence(false);
    }
  };

  const handleCompetenceYearsBlur = (index: number, event: FocusEvent<HTMLInputElement>) => {
    const nextFocusedElement = event.relatedTarget as HTMLElement | null;
    if (nextFocusedElement?.dataset.skipCompetencePersist === "true") {
      return;
    }

    void persistCompetenceYears(index);
  };

  const updateCompetenceYears = (indexToUpdate: number, yearsOfExperienceInput: string) => {
    const parsedYears = Number(yearsOfExperienceInput);
    if (!Number.isFinite(parsedYears) || parsedYears <= 0) {
      return;
    }

    setAddedCompetences((previousCompetences) =>
      previousCompetences.map((competence, index) => (index === indexToUpdate ? { ...competence, yearsOfExperience: parsedYears } : competence)),
    );
  };

  const selectableCompetences = useMemo(() => {
    const selectedCompetenceIDs = new Set(addedCompetences.map((competence) => normalizeId(competence.competenceID)).filter((id): id is number => id != null));

    return availableCompetences.filter((competence) => {
      const competenceID = normalizeId(competence.id);
      return competenceID == null || !selectedCompetenceIDs.has(competenceID);
    });
  }, [addedCompetences, availableCompetences]);

  const getCompetenceName = (competenceID: number | string) => {
    const normalizedCompetenceID = normalizeId(competenceID);
    const competence = availableCompetences.find((item) => normalizeId(item.id) === normalizedCompetenceID);
    return competence?.name ?? String(competenceID);
  };

  const addAvailabilityRange = async () => {
    if (isSavingAvailability) {
      return;
    }

    const from = selectedAvailability?.from;
    const to = selectedAvailability?.to;

    if (!from || !to) {
      showErrorAlert(messages.availabilityInvalidInput);
      return;
    }

    setIsSavingAvailability(true);

    try {
      await fetchWithSchema(
        "/api/application/addUserAvailability",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromDate: toISODate(from),
            toDate: toISODate(to),
          }),
        },
        addUserAvailabilityResponseSchema,
      );

      setSelectedAvailability(undefined);
      await loadApplicationData({ skipLoadingState: true });
    } catch (error) {
      if (error instanceof APIError && error.statusCode === 401) {
        onUnauthorized();
        return;
      }

      console.error("Failed to add availability:", error);
      showErrorAlert(messages.loadingError);
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const removeAvailabilityRange = async (indexToRemove: number) => {
    if (isSavingAvailability) {
      return;
    }

    const targetAvailability = availabilityRanges[indexToRemove];
    const availabilityID = normalizeId(targetAvailability?.availabilityID);

    if (targetAvailability == null) {
      return;
    }

    if (availabilityID == null) {
      showErrorAlert(messages.loadingError);
      return;
    }

    setIsSavingAvailability(true);

    try {
      await managedFetch("/api/application/deleteUserAvailability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityID }),
      });

      await loadApplicationData({ skipLoadingState: true });
    } catch (error) {
      if (error instanceof APIError && error.statusCode === 401) {
        onUnauthorized();
        return;
      }

      console.error("Failed to delete availability:", error);
      showErrorAlert(messages.loadingError);
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const submitApplication = async () => {
    if (isSubmittingApplication) {
      return;
    }

    setIsSubmittingApplication(true);
    try {
      await managedFetch("/api/application/submitApplication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      await loadApplicationData();
    } catch (error) {
      if (error instanceof APIError && error.statusCode === 401) {
        onUnauthorized();
        return;
      }

      console.error("Failed to submit application:", error);
      setHasLoadError(true);
      showErrorAlert(messages.loadingError);
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const clearApplication = async () => {
    for (const competence of addedCompetences) {
      const competenceProfileID = normalizeId(competence.competenceProfileID);
      if (competenceProfileID == null) continue;

      await managedFetch("/api/application/deleteUserCompetence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competenceProfileID }),
      });
    }
    for (const range of availabilityRanges) {
      const availabilityID = normalizeId(range.availabilityID);
      if (availabilityID == null) continue;

      await managedFetch("/api/application/deleteUserAvailability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityID }),
      });
    }
    setAddedCompetences([]);
    setAvailabilityRanges([]);
    setSelectedCompetenceID(null);
    setYearsInput("");
    setSelectedAvailability(undefined);
  };

  return {
    userData,
    selectableCompetences,
    isLoadingData,
    hasLoadError,
    isSavingCompetence,
    isSavingAvailability,
    isSubmittingApplication,
    submittedApplication,
    selectedCompetenceID,
    setSelectedCompetenceID,
    yearsInput,
    setYearsInput,
    addedCompetences,
    selectedAvailability,
    setSelectedAvailability,
    availabilityRanges,
    addCompetence,
    removeCompetence,
    handleCompetenceYearsBlur,
    updateCompetenceYears,
    getCompetenceName,
    addAvailabilityRange,
    removeAvailabilityRange,
    submitApplication,
    clearApplication,
  };
};
