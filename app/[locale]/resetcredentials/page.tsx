"use client";

import { useTranslations } from "next-intl";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useState } from "react";
import { MockEmailDialog } from "./mockEmailDialog";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/**
 *
 * @returns
 */
const ResetCredentialsPage = () => {
  const t = useTranslations("ResetCredentialsPage");
  const tRegister = useTranslations("RegisterPage");
  const [open, setOpen] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  const emailSchema = z.object({
    email: z.string().email(tRegister("validation.emailInvalid")).min(1, t("emailRequired")),
  });

  type EmailFormData = z.infer<typeof emailSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailFormData) => {
    const res = await fetch("/api/resetcredentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });

    if (!res.ok) {
      alert(t("emailNotFoundError"));
      return;
    }

    const { token } = await res.json();
    setSubmittedEmail(data.email);
    setGeneratedToken(token);
    console.log("email: " + data.email);
    console.log("token: " + token);
    setResetUrl(`${window.location.origin}/resetcredentials/${token}`);
    setOpen(true);
  };

  return (
    <>
      <div className="container mx-auto max-w-md py-10">
        <Card className="p-6">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-xs text-gray-500">{t("description")}</p>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Field className="gap-1.5">
              <FieldLabel>{t("email")}</FieldLabel>
              <Input placeholder={t("placeholders.email")} {...register("email", { required: true })} aria-invalid={!!errors.email} />
              <FieldError>{errors.email?.message}</FieldError>
            </Field>
            <Button type="submit" className="w-full mt-4">
              {t("sendResetLink")}
            </Button>
            <Link href="/login" className="block text-center text-blue-500">
              {t("backToLogin")}
            </Link>
            <p className="text-xs text-gray-500 text-center">{t("forgotEmail")}</p>
          </form>
        </Card>
      </div>

      <MockEmailDialog open={open} onOpenChange={setOpen} email={submittedEmail} token={generatedToken} resetUrl={resetUrl} />
    </>
  );
};

export default ResetCredentialsPage;
