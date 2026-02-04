"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { NewUserDTO } from "@/lib/schemas/userDTO";
import { managedFetch } from "@/lib/api";
import { APIError } from "@/lib/errors/generalErrors";
import { useRouter } from "next/navigation";

/**
 * Displays the registration page with multiple input fields.
 *
 * @returns {JSX.Element} The rendered registration page component.
 */
const RegisterPage = () => {
  const router = useRouter();
  const t = useTranslations("RegisterPage");

  const registerSchema = z
    .object({
      firstName: z.string().min(2, t("validation.firstNameMin")),
      lastName: z.string().min(2, t("validation.lastNameMin")),
      username: z.string().min(3, t("validation.usernameMin")),
      personalNumber: z.string().regex(/^\d{8}-\d{4}$|^\d{12}$/, t("validation.personalNumberInvalid")),
      email: z.string().email(t("validation.emailInvalid")),
      password: z
        .string()
        .min(8, t("validation.passwordMin"))
        .regex(/[A-Z]/, t("validation.passwordUppercase"))
        .regex(/[a-z]/, t("validation.passwordLowercase"))
        .regex(/[0-9]/, t("validation.passwordNumber")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordsMismatch"),
      path: ["confirmPassword"],
    });

  type RegisterFormData = z.infer<typeof registerSchema>;
  const formFields: Array<{ name: keyof RegisterFormData; type: string }> = [
    { name: "firstName", type: "text" },
    { name: "lastName", type: "text" },
    { name: "username", type: "text" },
    { name: "personalNumber", type: "text" },
    { name: "email", type: "email" },
    { name: "password", type: "password" },
    { name: "confirmPassword", type: "password" },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const userData: NewUserDTO = {
        name: data.firstName,
        surname: data.lastName,
        username: data.username,
        pnr: data.personalNumber,
        email: data.email,
        password: data.password,
      };

      // TODO: Fix translations for server responses.
      await managedFetch<{ userID: number }>("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
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
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;
