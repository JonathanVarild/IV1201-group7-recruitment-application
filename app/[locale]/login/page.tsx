"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { CredentialsDTO, credentialsSchema } from "@/lib/schemas/loginDTO";
import { managedFetch } from "@/lib/api";
import { UserData } from "@/lib/types/userType";
import { useRouter } from "next/navigation";
import { APIError } from "@/lib/errors/generalErrors";
import Link from "next/link";

/**
 * Display the login page with username and password fields.
 *
 * @returns {JSX.Element} The rendered login page component.
 */
const LoginPage = () => {
  const router = useRouter();
  const t = useTranslations("LoginPage");

  const loginSchema = credentialsSchema.extend({
    username: credentialsSchema.shape.username.trim().min(1, t("validation.usernameRequired")),
    password: credentialsSchema.shape.password.min(1, t("validation.passwordRequired")),
  });

  type LoginFormData = z.infer<typeof loginSchema>;
  const formFields: Array<{ name: keyof LoginFormData; type: string }> = [
    { name: "username", type: "text" },
    { name: "password", type: "password" },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const userCredentials: CredentialsDTO = {
        username: data.username,
        password: data.password,
      };

      // TODO: Fix translations for server responses.
      await managedFetch<{ userData: UserData }>("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userCredentials),
      });

      router.push("/");
    } catch (error) {
      if (error instanceof APIError) {
        const data = error.jsonData as { error?: string };
        alert(data.error || "Unknown error occurred during registration.");
      } else {
        console.error(error);
        alert("Registration failed due to an unexpected error.");
      }
    }
  };

  return (
    <div className="container mx-auto max-w-md py-10">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formFields.map(({ name, type }) => (
            <Field key={name} data-invalid={!!errors[name]} className="gap-1.5">
              <FieldLabel htmlFor={name}>{t(name)}</FieldLabel>
              <Input id={name} type={type} placeholder={t(`placeholders.${name}`)} {...register(name)} aria-invalid={!!errors[name]} />
              <FieldError>{errors[name]?.message}</FieldError>
            </Field>
          ))}

          <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
            {isSubmitting ? t("submitting") : t("submitButton")}
          </Button>
          <Link href="/resetcredentials" className="text-blue-500 text-center">
            {t("forgotPasswordUsername")}
          </Link>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
