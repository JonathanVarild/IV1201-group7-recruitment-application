"use client";

import { useState } from "react";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { type DateRange } from "react-day-picker";

type Competence = {
  id: number;
  name: string;
};

type SetCompetenceDTO = {
  competenceID: number;
  yearsOfExperience: number;
};

type AvailabilityRange = {
  from: Date;
  to: Date;
};

const setCompetenceSchema = z.object({
  competenceID: z.number().int().nonnegative(),
  yearsOfExperience: z.coerce.number().gt(0),
});

const ApplyPage = () => {
  const locale = useLocale();
  const t = useTranslations("ApplyPage");
  const accountEmail = "mail@mail.org"; // TODO: Replace with user data fetched from account API.
  const firstName = "First";
  const lastName = "Last";
  // TODO: Replace with competences fetched from API.
  const availableCompetences: Competence[] = [
    { id: 1, name: "Ticket sales" },
    { id: 2, name: "Lotteries" },
    { id: 3, name: "Roller coaster operations" },
  ];

  const [selectedCompetenceID, setSelectedCompetenceID] = useState<number | null>(null);
  const [yearsInput, setYearsInput] = useState("");
  const [addedCompetences, setAddedCompetences] = useState<SetCompetenceDTO[]>([]);
  const [competenceError, setCompetenceError] = useState<string | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<DateRange | undefined>(undefined);
  const [availabilityRanges, setAvailabilityRanges] = useState<AvailabilityRange[]>([]);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

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

        <Field className="gap-1.5">
          <FieldLabel htmlFor="contact-first-name">{t("contactInformation.firstName")}</FieldLabel>
          <Input id="contact-first-name" type="text" value={firstName} readOnly className="bg-muted text-muted-foreground cursor-text" />
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="contact-last-name">{t("contactInformation.lastName")}</FieldLabel>
          <Input id="contact-last-name" type="text" value={lastName} readOnly className="bg-muted text-muted-foreground cursor-text" />
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="contact-email">{t("contactInformation.email")}</FieldLabel>
          <Input id="contact-email" type="email" value={accountEmail} readOnly className="bg-muted text-muted-foreground cursor-text" />
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
        <Calendar
          mode="range"
          selected={selectedAvailability}
          onSelect={setSelectedAvailability}
          className={cn("rounded-md border", availabilityError && "apply-shake-x border-destructive/70")}
        />

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
