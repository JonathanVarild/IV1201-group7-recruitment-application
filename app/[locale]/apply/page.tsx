"use client";

import { useEffect, useState } from "react";
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

type SetCompetenceDTO = {
  competenceID: number;
  yearsOfExperience: number;
};

type AvailabilityRange = {
  from: Date;
  to: Date;
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

  const [selectedCompetenceID, setSelectedCompetenceID] = useState<number | null>(null);
  const [yearsInput, setYearsInput] = useState("");
  const [addedCompetences, setAddedCompetences] = useState<SetCompetenceDTO[]>([]);
  const [competenceError, setCompetenceError] = useState<string | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<DateRange | undefined>(undefined);
  const [availabilityRanges, setAvailabilityRanges] = useState<AvailabilityRange[]>([]);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  useEffect(() => {
    if (status === AuthStatus.Unauthenticated) {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== AuthStatus.Authenticated) {
      return;
    }

    let cancelled = false;

    const loadApplicationData = async () => {
      setIsLoadingData(true);
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

        if (cancelled) return;

        let shouldRedirectToLogin = false;

        if (detailsResult.status === "fulfilled") {
          const details = detailsResult.value;
          setUserData(details.userData);
          setAddedCompetences(details.competences.map((competence) => ({ competenceID: competence.id, yearsOfExperience: competence.yearsOfExperience })));
          setAvailabilityRanges(details.availability.map((availability) => ({ from: new Date(availability.fromDate), to: new Date(availability.toDate) })));
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
        if (cancelled) {
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
        if (!cancelled) {
          setIsLoadingData(false);
        }
      }
    };

    loadApplicationData();
    return () => {
      cancelled = true;
    };
  }, [locale, status, router, refreshAuth]);

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
    setAddedCompetences((prev) => prev.filter((_, index) => index !== indexToRemove));
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
    setAvailabilityRanges((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const formatDateRange = (range: AvailabilityRange) => `${range.from.toLocaleDateString(locale)} - ${range.to.toLocaleDateString(locale)}`;

  return (
    <div className="container mx-auto max-w-md space-y-5 py-10">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("contactInformation.title")}</h2>
        {isLoadingData && <p className="text-sm text-muted-foreground">{t("loadingData")}</p>}
        {hasLoadError && <p className="text-sm text-destructive">{t("loadingError")}</p>}

        <Field className="gap-1.5">
          <FieldLabel htmlFor="contact-first-name">{t("contactInformation.firstName")}</FieldLabel>
          <Input id="contact-first-name" type="text" value={userData?.firstName ?? ""} readOnly className="bg-muted text-muted-foreground cursor-text" />
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="contact-last-name">{t("contactInformation.lastName")}</FieldLabel>
          <Input id="contact-last-name" type="text" value={userData?.lastName ?? ""} readOnly className="bg-muted text-muted-foreground cursor-text" />
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="contact-email">{t("contactInformation.email")}</FieldLabel>
          <Input id="contact-email" type="email" value={userData?.email ?? ""} readOnly className="bg-muted text-muted-foreground cursor-text" />
        </Field>
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
    </div>
  );
};

export default ApplyPage;
