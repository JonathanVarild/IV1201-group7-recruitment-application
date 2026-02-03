"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

export default function LoginPage() {
  const t = useTranslations("LoginPage");

  const loginSchema = z.object({
    email: z.string().email(t("validation.emailInvalid")),
    password: z.string().min(1, t("validation.passwordRequired")),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const formFields: Array<{ name: keyof LoginFormData; type: string }> = [
    { name: "email", type: "email" },
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
    console.log("=== FORM SUBMITTED SUCCESSFULLY ===");
    console.log("Form data:", data);
    try {
      // TODO: Implement API call to login user
    } catch (error) {
      console.error("Login error:", error);
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

          <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
            {isSubmitting ? t("submitting") : t("submitButton")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
