"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
