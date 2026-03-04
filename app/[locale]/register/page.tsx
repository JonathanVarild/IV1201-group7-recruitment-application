"use client";

import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { NewUserDTO, registerFormSchema, RegisterFormData } from "@/lib/schemas/userDTO";
import { managedFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { handleClientError } from "@/lib/utils";

/**
 * Displays the registration page with multiple input fields.
 *
 * @returns {JSX.Element} The rendered registration page component.
 */
const RegisterPage = () => {
  const router = useRouter();
  const t = useTranslations("RegisterPage");
  const tErrors = useTranslations("errors");
  const { refreshAuth } = useAuth();

  const formFields: Array<{ name: keyof RegisterFormData; type: string; translationKey: string }> = [
    { name: "name", type: "text", translationKey: "firstName" },
    { name: "surname", type: "text", translationKey: "lastName" },
    { name: "username", type: "text", translationKey: "username" },
    { name: "pnr", type: "text", translationKey: "personalNumber" },
    { name: "email", type: "email", translationKey: "email" },
    { name: "password", type: "password", translationKey: "password" },
    { name: "confirmPassword", type: "password", translationKey: "confirmPassword" },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const userData: NewUserDTO = {
        name: data.name,
        surname: data.surname,
        username: data.username,
        pnr: data.pnr,
        email: data.email,
        password: data.password,
      };

      await managedFetch<{ userID: number }>("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      router.push("/");
      refreshAuth();
    } catch (error) {
      handleClientError(error, tErrors);
    }
  };

  return (
    <div className="container mx-auto max-w-md py-10">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formFields.map(({ name, type, translationKey }) => (
            <Field key={name} data-invalid={!!errors[name]} className="gap-1.5">
              <FieldLabel htmlFor={name}>{t(translationKey)}</FieldLabel>
              <Input id={name} type={type} placeholder={t(`placeholders.${translationKey}`)} {...register(name)} aria-invalid={!!errors[name]} />
              <FieldError>{errors[name]?.message && t(errors[name].message)}</FieldError>
            </Field>
          ))}

          <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
            {isSubmitting ? t("submitting") : t("submitButton")}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;
