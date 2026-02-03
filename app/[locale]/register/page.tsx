"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

/**
 * Displays the registration page with multiple input fields.
 *
 * @returns {JSX.Element} The rendered registration page component.
 */
const RegisterPage = () => {
  const t = useTranslations("RegisterPage");

  const registerSchema = z
    .object({
      firstName: z.string().min(2, t("validation.firstNameMin")),
      lastName: z.string().min(2, t("validation.lastNameMin")),
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
    console.log("=== FORM SUBMITTED SUCCESSFULLY ===");
    console.log("Form data:", data);
    try {
      // TODO: Implement API call to register user
    } catch (error) {
      console.error("Registration error:", error);
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
