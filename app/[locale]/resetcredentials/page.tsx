"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/dist/client/components/navigation";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import Link from "next/link";

/**
 * SHOULD MOCK AN EMAIL BEING SENT (IF IT IS TOO HARD TO ACTUALLY IMPLEMENT)
 */
const ResetCredentialsPage = () => {
  const router = useRouter();
  const t = useTranslations("ResetCredentialsPage");

  return (
    <div className="container mx-auto max-w-md py-10">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-xs text-gray-500">{t("description")}</p>
        <form /*onSubmit={handleSubmit(onSubmit)}*/ noValidate className="space-y-4">
          <Field className="gap-1.5">
            <FieldLabel>{t("email")}</FieldLabel>
            <Input placeholder={t("placeholders.email")} />
            <FieldError></FieldError>
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
  );
};

export default ResetCredentialsPage;
