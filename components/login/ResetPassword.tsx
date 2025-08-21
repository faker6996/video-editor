"use client";

import Button from "@/components/ui/Button";
import { Form, FormInput, FormActions, FormSubmitButton } from "@/components/ui/Form";
import Alert from "@/components/ui/Alert";
import { useLocale } from "@/lib/hooks/useLocale";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { LOCALE } from "@/lib/constants/enum";
import { useTranslations } from "next-intl";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { API_ROUTES } from "@/lib/constants/api-routes";

export default function ResetPassword() {
  /* ---------- hooks ---------- */
  const locale = useLocale();
  const t = useTranslations("ResetPassword");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  /* ---------- state ---------- */
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  /* ---------- submit ---------- */
  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      await callApi<null>(API_ROUTES.RESET_PASSWORD.RESET, HTTP_METHOD_ENUM.POST, { token, password: values.password }, { silent: true });
      setSuccess(true);
      setMessage("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("errorDefault");
      setMessage(msg);
    }
  };

  /* ---------- UI ---------- */
  if (success) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4 text-center">
        <h2 className="text-xl font-semibold text-success">{t("successTitle")}</h2>
        <Button>
          <Link href={`/${locale}/login`}>{t("backToLogin")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4 p-6">
      <h2 className="text-xl font-semibold">{t("heading")}</h2>

      <Form
        initialValues={{ password: "", confirmPassword: "" }}
        validationSchema={{
          password: { required: true, minLength: 6 },
          confirmPassword: { required: true },
        }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <FormInput
          name="password"
          type="password"
          placeholder={t("passwordPlaceholder")}
          label="New Password"
          required
          description="Password must be at least 6 characters"
        />

        <FormInput name="confirmPassword" type="password" placeholder="Confirm new password" label="Confirm Password" required />

        <FormActions className="justify-center">
          <FormSubmitButton className="w-full">{t("submitButton")}</FormSubmitButton>
        </FormActions>
      </Form>

      {message && <Alert variant="error" description={message} />}
    </div>
  );
}
