"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, handleClientError } from "@/lib/utils";
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

const setCompetenceSchema = z.object({
  competenceID: z.number().int().nonnegative(),
  yearsOfExperience: z.coerce.number().gt(0),
});

const ApplyPage = () => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ApplyPage");
  const tErrors = useTranslations("errors");
  const { status, refreshAuth } = useAuth();
  const [userData, setUserData] = useState<FullUserData | null>(null);
  const [availableCompetences, setAvailableCompetences] = useState<Competence[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCompetenceID, setSelectedCompetenceID] = useState<number | null>(null);
  const [yearsInput, setYearsInput] = useState("");
  const [addedCompetences, setAddedCompetences] = useState<CompetenceEntry[]>([]);
  const [competenceError, setCompetenceError] = useState<string | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<DateRange | undefined>(undefined);
  const [availabilityRanges, setAvailabilityRanges] = useState<AvailabilityRange[]>([]);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [removedCompetenceProfileIDs, setRemovedCompetenceProfileIDs] = useState<number[]>([]);
  const [removedAvailabilityIDs, setRemovedAvailabilityIDs] = useState<number[]>([]);

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

        let shouldRedirectToLogin = false;

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
          shouldRedirectToLogin = true;
        } else {
          console.error("Failed to load user details:", detailsResult.reason);
          setHasLoadError(true);
        }

        if (competenceListResult.status === "fulfilled") {
          setAvailableCompetences(competenceListResult.value);
        } else if (competenceListResult.reason instanceof APIError && competenceListResult.reason.statusCode === 401) {
          shouldRedirectToLogin = true;
        } else {
          console.error("Failed to load competence list:", competenceListResult.reason);
          setHasLoadError(true);
        }

        if (shouldRedirectToLogin) {
          refreshAuth();
          router.replace("/login");
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

  const addCompetence = () => {
    const result = setCompetenceSchema.safeParse({
      competenceID: selectedCompetenceID,
      yearsOfExperience: yearsInput,
    });

    if (!result.success) {
      setCompetenceError(t("competences.invalidInput"));
      return;
    }

    setCompetenceError(null);
    setAddedCompetences((prev) => [...prev, result.data]);
    setSelectedCompetenceID(null);
    setYearsInput("");
  };

  const removeCompetence = (indexToRemove: number) => {
    setAddedCompetences((prev) => {
      const target = prev[indexToRemove];
      const competenceProfileID = normalizeId(target?.competenceProfileID);
      if (competenceProfileID != null) {
        setRemovedCompetenceProfileIDs((prevRemoved) => [...prevRemoved, competenceProfileID]);
      }
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const getCompetenceName = (competenceID: number) => availableCompetences.find((competence) => competence.id === competenceID)?.name ?? String(competenceID);

  const addAvailabilityRange = () => {
    const from = selectedAvailability?.from;
    const to = selectedAvailability?.to;

    if (!from || !to) {
      setAvailabilityError(t("availability.invalidInput"));
      return;
    }

    setAvailabilityError(null);
    setAvailabilityRanges((prev) => [...prev, { from, to }]);
    setSelectedAvailability(undefined);
  };

  const removeAvailabilityRange = (indexToRemove: number) => {
    setAvailabilityRanges((prev) => {
      const target = prev[indexToRemove];
      const availabilityID = normalizeId(target?.availabilityID);
      if (availabilityID != null) {
        setRemovedAvailabilityIDs((prevRemoved) => [...prevRemoved, availabilityID]);
      }
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const formatDateRange = (range: AvailabilityRange) => `${range.from.toLocaleDateString(locale)} - ${range.to.toLocaleDateString(locale)}`;
  const formatDateForApi = (date: Date) => date.toLocaleDateString("sv-SE");

  const contactFields = [
    { id: "contact-first-name", labelKey: "contactInformation.firstName", value: userData?.firstName ?? "" },
    { id: "contact-last-name", labelKey: "contactInformation.lastName", value: userData?.lastName ?? "" },
    { id: "contact-user-name", labelKey: "contactInformation.username", value: userData?.username ?? "" },
    { id: "contact-email", labelKey: "contactInformation.email", value: userData?.email ?? "" },
    { id: "contact-personal-number", labelKey: "contactInformation.pnr", value: userData?.pnr ?? "" },
  ];

  const submitApplication = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updateRequests = [
        ...removedCompetenceProfileIDs.map((competenceProfileID) =>
          managedFetch("/api/application/deleteUserCompetence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ competenceProfileID }),
          }),
        ),
        ...addedCompetences.map((competence) =>
          managedFetch("/api/application/setUserCompetence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ competenceID: competence.competenceID, yearsOfExperience: competence.yearsOfExperience }),
          }),
        ),
        ...removedAvailabilityIDs.map((availabilityID) =>
          managedFetch("/api/application/deleteUserAvailability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ availabilityID }),
          }),
        ),
        ...availabilityRanges.map((range) => {
          if (range.availabilityID != null) {
            return managedFetch("/api/application/setUserAvailability", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                availabilityID: range.availabilityID,
                fromDate: formatDateForApi(range.from),
                toDate: formatDateForApi(range.to),
              }),
            });
          }

          return managedFetch<{ availabilityID: number }>("/api/application/addUserAvailability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromDate: formatDateForApi(range.from),
              toDate: formatDateForApi(range.to),
            }),
          });
        }),
      ];

      await Promise.all(updateRequests);

      setRemovedCompetenceProfileIDs([]);
      setRemovedAvailabilityIDs([]);

      await managedFetch<{ applicationID: number }>("/api/application/submitApplication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      await loadApplicationData({ skipLoadingState: true });

      alert(t("submitSuccess"));
    } catch (error) {
      if (error instanceof APIError && error.statusCode === 401) {
        refreshAuth();
        router.replace("/login");
        return;
      }

      handleClientError(error, tErrors);
    } finally {
      setIsSubmitting(false);
    }
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
            <Select value={selectedCompetenceID?.toString()} onValueChange={(value) => setSelectedCompetenceID(Number(value))}>
              <SelectTrigger id="competence-picker" className="w-full">
                <SelectValue placeholder={t("competences.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {availableCompetences.map((competence) => (
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
            />
          </Field>

          <Button type="button" onClick={addCompetence}>
            {t("competences.add")}
          </Button>
        </div>

        {addedCompetences.map((competence, index) => (
          <div key={`${competence.competenceID}-${index}`} className="grid grid-cols-[1fr_7rem_auto] gap-2 items-end">
            <Input value={getCompetenceName(competence.competenceID)} readOnly className="bg-muted text-muted-foreground cursor-text" />
            <Input value={competence.yearsOfExperience} readOnly className="bg-muted text-muted-foreground cursor-text" />
            <Button type="button" variant="outline" onClick={() => removeCompetence(index)}>
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
            onSelect={setSelectedAvailability}
            locale={getDateFnsLocale(locale)}
            className={cn("rounded-md border", availabilityError && "apply-shake-x border-destructive/70")}
          />
        </div>

        <Button type="button" onClick={addAvailabilityRange} className="w-fit">
          {t("availability.add")}
        </Button>

        {availabilityRanges.map((range, index) => (
          <div key={`${range.from.toISOString()}-${range.to.toISOString()}-${index}`} className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <Input value={formatDateRange(range)} readOnly className="bg-muted text-muted-foreground cursor-text" />
            <Button type="button" variant="outline" onClick={() => removeAvailabilityRange(index)}>
              {t("availability.remove")}
            </Button>
          </div>
        ))}

        {availabilityError && <p className="text-destructive text-sm">{availabilityError}</p>}
      </Card>

      <Button type="button" className="w-full" onClick={submitApplication} disabled={isLoadingData || hasLoadError || isSubmitting}>
        {isSubmitting ? t("submitting") : t("submitButton")}
      </Button>
    </div>
  );
};

export default ApplyPage;
