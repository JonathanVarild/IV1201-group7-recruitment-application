"use client";

import { useCallback, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type DateRange } from "react-day-picker";
import { AuthStatus, useAuth } from "@/components/AuthProvider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { getDateFnsLocale } from "@/lib/dateLocales";
import { Skeleton } from "@/components/ui/skeleton";
import { type ApplicationStatus, useApplyPageData } from "./useApplyPageData";

const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const ApplyPage = () => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ApplyPage");
  const { status, refreshAuth } = useAuth();

  const handleUnauthorized = useCallback(() => {
    alert(t("errors.invalidSessionError"));
    refreshAuth();
    router.replace("/login");
  }, [refreshAuth, router, t]);

  const {
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
  } = useApplyPageData({
    locale,
    status,
    onUnauthorized: handleUnauthorized,
    messages: {
      competenceInvalidInput: t("errors.competenceInvalidInput"),
      availabilityInvalidInput: t("errors.availabilityInvalidInput"),
      loadingError: t("errors.loadingError"),
    },
  });

  useEffect(() => {
    if (status === AuthStatus.Unauthenticated) {
      router.replace("/login");
    }
  }, [status, router]);

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

  const formatDateRange = (range: { from: Date; to: Date }) => `${range.from.toLocaleDateString(locale)} - ${range.to.toLocaleDateString(locale)}`;

  const contactFields = [
    { id: "contact-first-name", labelKey: "contactInformation.firstName", value: userData?.firstName ?? "" },
    { id: "contact-last-name", labelKey: "contactInformation.lastName", value: userData?.lastName ?? "" },
    { id: "contact-user-name", labelKey: "contactInformation.username", value: userData?.username ?? "" },
    { id: "contact-email", labelKey: "contactInformation.email", value: userData?.email ?? "" },
    { id: "contact-personal-number", labelKey: "contactInformation.pnr", value: userData?.pnr ?? "" },
  ];

  const getApplicationStatusText = (applicationStatus: ApplicationStatus) => {
    switch (applicationStatus) {
      case "unhandled":
        return t("applicationStatus.statuses.unhandled");
      case "accepted":
        return t("applicationStatus.statuses.accepted");
      case "rejected":
        return t("applicationStatus.statuses.rejected");
    }
  };

  const formatApplicationDateTime = (dateString: string | null) => {
    if (dateString == null) {
      return null;
    }

    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) {
      return dateString;
    }

    return parsedDate.toLocaleString(locale);
  };

  return (
    <div className="container mx-auto max-w-md space-y-5 py-10">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </Card>

      {submittedApplication != null ? (
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("applicationStatus.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("applicationStatus.description")}</p>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">{t("applicationStatus.statusLabel")}:</span> {getApplicationStatusText(submittedApplication.status)}
            </p>
            <p>
              <span className="font-medium">{t("applicationStatus.submittedAtLabel")}:</span> {formatApplicationDateTime(submittedApplication.createdAt)}
            </p>
            {submittedApplication.updatedAt != null && (
              <p>
                <span className="font-medium">{t("applicationStatus.updatedAtLabel")}:</span> {formatApplicationDateTime(submittedApplication.updatedAt)}
              </p>
            )}
          </div>
        </Card>
      ) : (
        <>
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

                {contactFields.map((field) => (
                  <Field key={field.id} className="gap-1.5">
                    <FieldLabel htmlFor={field.id}>{t(field.labelKey)}</FieldLabel>
                    <Input id={field.id} type="text" value={field.value} readOnly className="bg-muted text-muted-foreground cursor-text" />
                  </Field>
                ))}
              </>
            )}
          </Card>

          {!isLoadingData && !hasLoadError && (
            <>
              <Card className="p-6 space-y-4">
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
              </Card>

              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">{t("availability.title")}</h2>
                <div className="flex justify-center">
                  <Calendar
                    mode="range"
                    selected={selectedAvailability}
                    onSelect={(range: DateRange | undefined) => {
                      if (isSavingAvailability) {
                        return;
                      }
                      setSelectedAvailability(range);
                    }}
                    locale={getDateFnsLocale(locale)}
                    className={cn("rounded-md border", isSavingAvailability && "pointer-events-none opacity-60")}
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
              </Card>

              <Button type="button" className="w-full" onClick={submitApplication} disabled={isLoadingData || hasLoadError || isSubmittingApplication}>
                {isSubmittingApplication ? t("submitting") : t("submitButton")}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ApplyPage;
