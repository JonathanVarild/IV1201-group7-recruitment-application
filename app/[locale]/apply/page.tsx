"use client";

import { type FocusEvent, useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { type DateRange } from "react-day-picker";
import { getDateFnsLocale } from "@/lib/dateLocales";
import { managedFetch } from "@/lib/api";
import { Competence, UserCompetence } from "@/lib/types/competenceType";
import { FullUserData } from "@/lib/types/userType";
import { AuthStatus, useAuth } from "@/components/AuthProvider";
import { APIError } from "@/lib/errors/generalErrors";
import { Skeleton } from "@/components/ui/skeleton";

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

type UserAvailabilityResponse = {
  availabilityID: number;
  fromDate: string;
  toDate: string;
};

type GetUserDetailsResponse = {
  userData: FullUserData;
  availability: UserAvailabilityResponse[];
  competences: UserCompetence[];
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

const setCompetenceSchema = z.object({
  competenceID: z.number().int().nonnegative(),
  yearsOfExperience: z.coerce.number().gt(0),
});

const ApplyPage = () => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ApplyPage");
  const { status, refreshAuth } = useAuth();
  const [userData, setUserData] = useState<FullUserData | null>(null);
  const [availableCompetences, setAvailableCompetences] = useState<Competence[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isSavingCompetence, setIsSavingCompetence] = useState(false);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  const [selectedCompetenceID, setSelectedCompetenceID] = useState<number | null>(null);
  const [yearsInput, setYearsInput] = useState("");
  const [addedCompetences, setAddedCompetences] = useState<CompetenceEntry[]>([]);
  const [competenceError, setCompetenceError] = useState<string | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<DateRange | undefined>(undefined);
  const [availabilityRanges, setAvailabilityRanges] = useState<AvailabilityRange[]>([]);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  useEffect(() => {
    if (status === AuthStatus.Unauthenticated) {
      router.replace("/login");
    }
  }, [status, router]);

  const loadApplicationData = useCallback(
    async (options?: { skipLoadingState?: boolean; isActive?: () => boolean }) => {
      const isActive = options?.isActive ?? (() => true);
      if (status !== AuthStatus.Authenticated || !isActive()) {
        return;
      }

      if (!options?.skipLoadingState) {
        setIsLoadingData(true);
      }
      setHasLoadError(false);
      try {
        const [detailsResult, competenceListResult] = await Promise.allSettled([
          managedFetch<GetUserDetailsResponse>("/api/application/getUserDetails", {
            method: "POST",
          }),
          managedFetch<Competence[]>("/api/application/getCompetenceList", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale: locale.split("-")[0] }),
          }),
        ]);

        if (!isActive()) return;

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
          router.replace("/login");
        } else {
          console.error("Failed to load user details:", detailsResult.reason);
          setHasLoadError(true);
        }

        if (competenceListResult.status === "fulfilled") {
          setAvailableCompetences(competenceListResult.value);
        } else if (competenceListResult.reason instanceof APIError && competenceListResult.reason.statusCode === 401) {
          router.replace("/login");
        } else {
          console.error("Failed to load competence list:", competenceListResult.reason);
          setHasLoadError(true);
        }
      } catch (error) {
        if (!isActive()) {
          return;
        }

        if (error instanceof APIError && error.statusCode === 401) {
          refreshAuth();
          router.replace("/login");
          return;
        }

        console.error("Failed to load application data:", error);
        setHasLoadError(true);
      } finally {
        if (!options?.skipLoadingState && isActive()) {
          setIsLoadingData(false);
        }
      }
    },
    [locale, status, router, refreshAuth],
  );

  useEffect(() => {
    if (status !== AuthStatus.Authenticated) {
      return;
    }

    let active = true;
    loadApplicationData({ isActive: () => active });

    return () => {
      active = false;
    };
  }, [status, loadApplicationData]);

  if (status === AuthStatus.Unauthenticated) {
    return null;
  }

  if (status === AuthStatus.Loading) {
    return (
      <div className="container mx-auto max-w-md space-y-5 py-10">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">{t("loadingData")}</p>
        </Card>
      </div>
    );
  }

  const addCompetence = async () => {
    if (isSavingCompetence) {
      return;
    }

    const result = setCompetenceSchema.safeParse({
      competenceID: selectedCompetenceID,
      yearsOfExperience: yearsInput,
    });

    if (!result.success) {
      setCompetenceError(t("competences.invalidInput"));
      return;
    }

    setCompetenceError(null);
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
        refreshAuth();
        router.replace("/login");
        return;
      }

      console.error("Failed to persist added competence:", error);
      setCompetenceError(t("loadingError"));
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
      setCompetenceError(t("loadingError"));
      return;
    }

    setCompetenceError(null);
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
        refreshAuth();
        router.replace("/login");
        return;
      }

      console.error("Failed to delete competence:", error);
      setCompetenceError(t("loadingError"));
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
      setCompetenceError(t("competences.invalidInput"));
      return;
    }

    setCompetenceError(null);
    setAddedCompetences((prev) => prev.map((competence, index) => (index === indexToUpdate ? { ...competence, yearsOfExperience: parsedYears } : competence)));
  };

  const persistCompetenceYears = async (indexToPersist: number) => {
    if (isSavingCompetence) {
      return;
    }

    const targetCompetence = addedCompetences[indexToPersist];
    if (targetCompetence == null) {
      return;
    }

    const result = setCompetenceSchema.safeParse({
      competenceID: targetCompetence.competenceID,
      yearsOfExperience: targetCompetence.yearsOfExperience,
    });

    if (!result.success) {
      setCompetenceError(t("competences.invalidInput"));
      return;
    }

    setCompetenceError(null);
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
        refreshAuth();
        router.replace("/login");
        return;
      }

      console.error("Failed to persist competence years:", error);
      setCompetenceError(t("loadingError"));
    } finally {
      setIsSavingCompetence(false);
    }
  };

  const getCompetenceName = (competenceID: number | string) => {
    const normalizedCompetenceID = normalizeId(competenceID);
    const competence = availableCompetences.find((item) => normalizeId(item.id) === normalizedCompetenceID);
    return competence?.name ?? String(competenceID);
  };

  const selectedCompetenceIDs = new Set(addedCompetences.map((competence) => normalizeId(competence.competenceID)).filter((id): id is number => id != null));
  const selectableCompetences = availableCompetences.filter((competence) => {
    const competenceID = normalizeId(competence.id);
    return competenceID == null || !selectedCompetenceIDs.has(competenceID);
  });

  const addAvailabilityRange = async () => {
    if (isSavingAvailability) {
      return;
    }

    const from = selectedAvailability?.from;
    const to = selectedAvailability?.to;

    if (!from || !to) {
      setAvailabilityError(t("availability.invalidInput"));
      return;
    }

    setAvailabilityError(null);
    setIsSavingAvailability(true);

    try {
      await managedFetch<{ availabilityID: number }>("/api/application/addUserAvailability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromDate: toISODate(from),
          toDate: toISODate(to),
        }),
      });

      setSelectedAvailability(undefined);
      await loadApplicationData({ skipLoadingState: true });
    } catch (error) {
      if (error instanceof APIError && error.statusCode === 401) {
        refreshAuth();
        router.replace("/login");
        return;
      }

      console.error("Failed to add availability:", error);
      setAvailabilityError(t("loadingError"));
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
      setAvailabilityError(t("loadingError"));
      return;
    }

    setAvailabilityError(null);
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
        refreshAuth();
        router.replace("/login");
        return;
      }

      console.error("Failed to delete availability:", error);
      setAvailabilityError(t("loadingError"));
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const formatDateRange = (range: AvailabilityRange) => `${range.from.toLocaleDateString(locale)} - ${range.to.toLocaleDateString(locale)}`;

  const contactFields = [
    { id: "contact-first-name", labelKey: "contactInformation.firstName", value: userData?.firstName ?? "" },
    { id: "contact-last-name", labelKey: "contactInformation.lastName", value: userData?.lastName ?? "" },
    { id: "contact-user-name", labelKey: "contactInformation.username", value: userData?.username ?? "" },
    { id: "contact-email", labelKey: "contactInformation.email", value: userData?.email ?? "" },
    { id: "contact-personal-number", labelKey: "contactInformation.pnr", value: userData?.pnr ?? "" },
  ];

  const submitApplication = async () => {
    await managedFetch("/api/application/submitApplication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  };

  return (
    <div className="container mx-auto max-w-md space-y-5 py-10">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </Card>

      <Card className="p-6 space-y-4">
        {isLoadingData ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            {contactFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold">{t("contactInformation.title")}</h2>
            {hasLoadError && <p className="text-sm text-destructive">{t("loadingError")}</p>}

            {contactFields.map((field) => (
              <Field key={field.id} className="gap-1.5">
                <FieldLabel htmlFor={field.id}>{t(field.labelKey)}</FieldLabel>
                <Input id={field.id} type="text" value={field.value} readOnly className="bg-muted text-muted-foreground cursor-text" />
              </Field>
            ))}
          </>
        )}
      </Card>

      <Card className={cn("p-6 space-y-4 transition-colors", competenceError && "apply-shake-x border-destructive/70 ring-1 ring-destructive/40")}>
        <h2 className="text-lg font-semibold">{t("competences.title")}</h2>
        <div className="grid grid-cols-[1fr_7rem_auto] gap-2 items-end">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="competence-picker">{t("competences.competence")}</FieldLabel>
            <Select value={selectedCompetenceID?.toString()} onValueChange={(value) => setSelectedCompetenceID(Number(value))} disabled={isSavingCompetence}>
              <SelectTrigger id="competence-picker" className="w-full">
                <SelectValue placeholder={t("competences.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {selectableCompetences.map((competence) => (
                  <SelectItem key={competence.id} value={competence.id.toString()}>
                    {competence.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field className="gap-1.5">
            <FieldLabel htmlFor="competence-years">{t("competences.years")}</FieldLabel>
            <Input
              id="competence-years"
              type="number"
              min={0.1}
              step="0.1"
              placeholder={t("competences.yearsPlaceholder")}
              value={yearsInput}
              onChange={(event) => setYearsInput(event.target.value)}
              disabled={isSavingCompetence}
            />
          </Field>

          <Button type="button" onClick={addCompetence} disabled={isSavingCompetence}>
            {t("competences.add")}
          </Button>
        </div>

        {addedCompetences.map((competence, index) => (
          <div key={`${competence.competenceID}-${index}`} className="grid grid-cols-[1fr_7rem_auto] gap-2 items-end">
            <Input value={getCompetenceName(competence.competenceID)} readOnly className="bg-muted text-muted-foreground cursor-text" />
            <Input
              type="number"
              min={0.1}
              step="0.1"
              value={competence.yearsOfExperience}
              onChange={(event) => updateCompetenceYears(index, event.target.value)}
              onBlur={(event) => handleCompetenceYearsBlur(index, event)}
              disabled={isSavingCompetence}
              className="cursor-text"
            />
            <Button type="button" variant="outline" data-skip-competence-persist="true" onClick={() => removeCompetence(index)} disabled={isSavingCompetence}>
              {t("competences.remove")}
            </Button>
          </div>
        ))}

        {competenceError && <p className="text-destructive text-sm">{competenceError}</p>}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("availability.title")}</h2>
        <div className="flex justify-center">
          <Calendar
            mode="range"
            selected={selectedAvailability}
            onSelect={(range) => {
              if (isSavingAvailability) {
                return;
              }
              setSelectedAvailability(range);
            }}
            locale={getDateFnsLocale(locale)}
            className={cn("rounded-md border", availabilityError && "apply-shake-x border-destructive/70", isSavingAvailability && "pointer-events-none opacity-60")}
          />
        </div>

        <Button type="button" onClick={addAvailabilityRange} className="w-fit" disabled={isSavingAvailability}>
          {t("availability.add")}
        </Button>

        {availabilityRanges.map((range, index) => (
          <div key={`${toISODate(range.from)}-${toISODate(range.to)}-${index}`} className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <Input value={formatDateRange(range)} readOnly className="bg-muted text-muted-foreground cursor-text" />
            <Button type="button" variant="outline" onClick={() => removeAvailabilityRange(index)} disabled={isSavingAvailability}>
              {t("availability.remove")}
            </Button>
          </div>
        ))}

        {availabilityError && <p className="text-destructive text-sm">{availabilityError}</p>}
      </Card>

      <Button type="button" className="w-full" onClick={submitApplication} disabled={isLoadingData || hasLoadError}>
        {t("submitButton")}
      </Button>
    </div>
  );
};

export default ApplyPage;
