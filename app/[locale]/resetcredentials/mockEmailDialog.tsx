"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

type MockEmailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  token: string;
  resetUrl: string;
};

/**
 * Mock email dialog simulating a credentials reset email.
 *
 * @param open indicates if dialog is open or not.
 * @param onOpenChange callback to handle dialog open state.
 * @param email entered user email.
 * @param token unique reset token used in link.
 * @param resetUrl the full url for the reset page.
 * @returns {JSX.Element} The rendered mock email dialog component.
 */
export const MockEmailDialog = ({ open, onOpenChange, email, token, resetUrl }: MockEmailDialogProps) => {
  const t = useTranslations("mockEmail");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden">
        <DialogTitle>
          <p>{t("from")}: donotreply@finnsinte.se</p>
          <Separator />
          <p>
            {t("to")}: {email}
          </p>
          <Separator />
          <p>
            {t("subject")}: {t("subjectContent")}
          </p>
          <Separator />
        </DialogTitle>

        <p>{t("hello")}!</p>
        <p>{t("emailContent")}</p>
        <p>{t("link")}:</p>
        <div className="min-w-0 overflow-hidden">
          <Link className="text-blue-500" href={`/resetcredentials/${token}`}>
            {resetUrl}
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};
