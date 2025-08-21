"use client";

import { useAuth } from "@/contexts/AuthContext";
import { FacebookIcon, GoogleIcon } from "@/components/icons/SocialIcons";
import { Form, FormInput, FormActions, FormSubmitButton } from "@/components/ui/Form";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { callApi } from "@/lib/utils/api-client";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/hooks/useLocale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import { loading } from "@/lib/utils/loading";
import { User } from "@/lib/models/user";

interface SsoReq {
  redirectUrl: string;
}

export default function RegisterContainer() {
  const router = useRouter();
  const { login } = useAuth();
  const locale = useLocale();
  const t = useTranslations("RegisterPage");
  const { addToast } = useToast();

  const handleRegisterWithFacebook = async () => {
    loading.show(t("social.registeringFacebook"));
    try {
      const res = await callApi<SsoReq>(API_ROUTES.AUTH.SSO_FACEBOOK, HTTP_METHOD_ENUM.POST, { locale, register: true });
      window.location.href = res?.redirectUrl!;
    } catch (err: any) {
      console.error("Facebook SSO register error:", err);
      addToast({
        type: "error",
        message: err?.message || t("errors.facebookRegisterFailed"),
      });
    } finally {
      loading.hide();
    }
  };

  const handleRegisterWithGoogle = async () => {
    loading.show(t("social.registeringGoogle"));
    try {
      const res = await callApi<SsoReq>(API_ROUTES.AUTH.SSO_GOOGLE, HTTP_METHOD_ENUM.POST, { locale, register: true });
      window.location.href = res?.redirectUrl!;
    } catch (err: any) {
      console.error("Google SSO register error:", err);
      addToast({
        type: "error",
        message: err?.message || t("errors.googleRegisterFailed"),
      });
    } finally {
      loading.hide();
    }
  };

  const handleEmailPasswordRegister = async (values: { name: string; email: string; password: string; confirmPassword: string }) => {
    // Validation
    if (values.password !== values.confirmPassword) {
      addToast({
        type: "error",
        message: t("errors.passwordMismatch"),
      });
      return;
    }

    loading.show(t("registering"));
    try {
      const registerResult = await callApi<any>(API_ROUTES.AUTH.REGISTER, HTTP_METHOD_ENUM.POST, {
        name: values.name,
        email: values.email,
        password: values.password,
      });

      // Fetch user data after successful registration
      const userData = await callApi<User>(API_ROUTES.AUTH.ME, HTTP_METHOD_ENUM.GET);
      if (userData) {
        login(userData, null); // Token is stored in cookie, not needed in context
      }

      addToast({
        type: "success",
        message: t("registerSuccess"),
      });

      window.location.href = `/${locale}/dashboard`;
    } catch (err: any) {
      console.error(err);
      addToast({
        type: "error",
        message: err?.message || t("errors.registerFailed"),
      });
    } finally {
      loading.hide();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo + Heading */}
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
            OCR
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t("heading")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-card text-card-foreground px-6 py-8 shadow sm:px-10">
          <Form
            initialValues={{ name: "", email: "", password: "", confirmPassword: "" }}
            validationSchema={{
              name: { required: true, minLength: 2 },
              email: { required: true, email: true },
              password: { required: true, minLength: 6 },
              confirmPassword: { required: true },
            }}
            onSubmit={handleEmailPasswordRegister}
            className="space-y-6"
          >
            <FormInput name="name" type="text" label={t("nameLabel")} placeholder="Enter your full name" required />

            <FormInput name="email" type="email" label={t("emailLabel")} placeholder="Enter your email" required />

            <FormInput
              name="password"
              type="password"
              label={t("passwordLabel")}
              placeholder="Enter your password"
              description="Password must be at least 6 characters"
              required
            />

            <FormInput name="confirmPassword" type="password" label={t("confirmPasswordLabel")} placeholder="Confirm your password" required />

            <FormActions className="justify-center">
              <FormSubmitButton className="w-full">{t("signUpButton")}</FormSubmitButton>
            </FormActions>
          </Form>

          {/* Divider */}
          <div className="mt-6 flex items-center">
            <div className="w-full border-t border-border" />
            <div className="px-4 text-sm text-muted-foreground whitespace-nowrap">{t("dividerText")}</div>
            <div className="w-full border-t border-border" />
          </div>

          {/* Social Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Button onClick={handleRegisterWithGoogle} icon={GoogleIcon}>
              {t("social.google")}
            </Button>
            <Button onClick={handleRegisterWithFacebook} icon={FacebookIcon}>
              {t("social.facebook")}
            </Button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("alreadyHaveAccount")}{" "}
              <Link href={`/${locale}/login`} className="text-primary hover:underline font-medium">
                {t("signInLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
