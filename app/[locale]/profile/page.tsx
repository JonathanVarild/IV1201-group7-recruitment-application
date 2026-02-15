"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth, AuthStatus } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { managedFetch } from "@/lib/api";

/**
 * Display the profile page with input fields for personal number, email, username and password. Also displays current information about the user.
 * @returns {JSX.Element} The rendered profile page component.
 */
const ProfilePage = () => {
  const { status, refreshAuth } = useAuth();
  const router = useRouter();
  const t = useTranslations("ProfilePage");
  const t2 = useTranslations("RegisterPage");

  const [currentUsername, setCurrentUsername] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentPnr, setCurrentPnr] = useState("");

  const profileSchema = z.object({
    username: z.string().min(3, t2("validation.usernameMin")).optional().or(z.literal("")),
    email: z.email(t2("validation.emailInvalid")).optional().or(z.literal("")),
    pnr: z
      .string()
      .regex(/^\d{8}-\d{4}$|^\d{12}$/, t2("validation.personalNumberInvalid"))
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, t2("validation.passwordMin"))
      .regex(/[A-Z]/, t2("validation.passwordUppercase"))
      .regex(/[a-z]/, t2("validation.passwordLowercase"))
      .regex(/[0-9]/, t2("validation.passwordNumber"))
      .optional()
      .or(z.literal("")),
  });

  type ProfileFormData = z.infer<typeof profileSchema>;
  const formFields: Array<{ name: keyof ProfileFormData; type: string }> = [
    { name: "username", type: "text" },
    { name: "email", type: "email" },
    { name: "pnr", type: "text" },
    { name: "password", type: "password" },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (status === AuthStatus.Unauthenticated) {
      router.push("/login");
      return;
    }
    if (status === AuthStatus.Authenticated) {
      fetchUserData();
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/whoami", { method: "POST" });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();

      setCurrentUsername(data.username);
      setCurrentEmail(data.email);
      setCurrentPnr(data.pnr);
    } catch (error) {
      // TODO: Handle error
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const updateData: Partial<ProfileFormData> = {};
      if (data.username) updateData.username = data.username;
      if (data.email) updateData.email = data.email;
      if (data.pnr) updateData.pnr = data.pnr;
      if (data.password) updateData.password = data.password;

      await managedFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      alert(t("updateSuccess"));
      refreshAuth();
    } catch (error) {
      // TODO: Handle error
    }
  };

  return (
    <div className="container mx-auto max-w-md py-10">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">
          {t("hello")} {currentUsername}!
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formFields.map(({ name, type }) => (
            <Field key={name} className="gap-1.5">
              <FieldLabel className="text-xs" htmlFor={name}>
                {t(`current.${name}`)}
                {name === "username" ? currentUsername : name === "email" ? currentEmail : name === "pnr" ? currentPnr : "******"}
              </FieldLabel>
              <Input id={name} type={type} placeholder={t(`placeholders.${name}`)} {...register(name)} aria-invalid={!!errors[name]} />
              <FieldError>{errors[name]?.message}</FieldError>
            </Field>
          ))}
          <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
            {isSubmitting ? t("updating") : t("updateButton")}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;
