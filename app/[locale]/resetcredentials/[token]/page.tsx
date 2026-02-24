"use client";

import { z } from "zod";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, use } from "react";
import { managedFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { APIError } from "@/lib/errors/generalErrors";
import { handleClientError } from "@/lib/utils";

/**
 * Page component for resetting the username and password.
 * Validates the token, and then lets user fill out new username and/or password.
 *
 * @param params contains the reset token.
 * @returns {JSX.Element} The rendered reset credentials page component.
 */
const ResetCredentialsTokenPage = ({ params }: { params: Promise<{ token: string }> }) => {
  const { token } = use(params);
  const { refreshAuth } = useAuth();
  const router = useRouter();
  const t = useTranslations("ResetCredentialsTokenPage");
  const tErrors = useTranslations("errors");

  const tProfile = useTranslations("ProfilePage");
  const tRegister = useTranslations("RegisterPage");

  const resetCredentialsSchema = z.object({
    username: z.string().min(3, tRegister("validation.usernameMin")).optional().or(z.literal("")),
    password: z
      .string()
      .min(8, t("validation.passwordMin"))
      .regex(/[A-Z]/, t("validation.passwordUppercase"))
      .regex(/[a-z]/, t("validation.passwordLowercase"))
      .regex(/[0-9]/, t("validation.passwordNumber"))
      .optional()
      .or(z.literal("")),
  });

  useEffect(() => {
    if (!token) router.push("/");
  }, [token, router]);

  type ResetCredentialsFormData = z.infer<typeof resetCredentialsSchema>;
  const formFields: Array<{ name: keyof ResetCredentialsFormData; type: string }> = [
    { name: "username", type: "text" },
    { name: "password", type: "password" },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetCredentialsFormData>({
    resolver: zodResolver(resetCredentialsSchema),
  });

  useEffect(() => {
    const validate = async () => {
      const res = await fetch("/api/resetcredentials/tokenvalidation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        router.push("/resetcredentials");
      }
    };

    validate();
  }, [token, router]);

  const onSubmit = async (data: ResetCredentialsFormData) => {
    try {
      const updateData: Partial<ResetCredentialsFormData> = {};
      if (data.username) updateData.username = data.username;
      if (data.password) updateData.password = data.password;

      await managedFetch("/api/resetcredentials/updatecredentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...updateData }),
      });

      alert(t("updateSuccess"));
      refreshAuth();
      router.push("/login");
    } catch (error) {
      if (error instanceof APIError && error.statusCode === 400) {
        alert(t("invalidToken"));
        router.push("/resetcredentials");
      } else {
        handleClientError(error, tErrors);
      }
    }
  };

  return (
    <div className="container mx-auto max-w-md py-10">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formFields.map(({ name, type }) => (
            <Field key={name} className="gap-1.5">
              <FieldLabel className="text-xs" htmlFor={name}></FieldLabel>
              <Input id={name} type={type} placeholder={t(`placeholders.${name}`)} {...register(name)} aria-invalid={!!errors[name]} />
              <FieldError>{errors[name]?.message}</FieldError>
            </Field>
          ))}
          <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
            {isSubmitting ? tProfile("updating") : tProfile("updateButton")}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetCredentialsTokenPage;
