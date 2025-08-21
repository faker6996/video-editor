"use client";

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FacebookIcon, GoogleIcon } from "@/components/icons/SocialIcons";
import { Form, FormInput, FormCheckbox, FormActions, FormSubmitButton } from "@/components/ui/Form";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { HTTP_METHOD_ENUM, LOCALE } from "@/lib/constants/enum";
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

export default function LoginContainer() {
  const router = useRouter();
  const { login } = useAuth();
  const locale = useLocale();
  const t = useTranslations("LoginPage");
  const { addToast } = useToast();
  const [passwordKey, setPasswordKey] = React.useState(0); // Key to force password field reset

  const handleLoginWithFacebook = async () => {
    loading.show(t("social.loggingInFacebook"));
    try {
      const res = await callApi<SsoReq>(API_ROUTES.AUTH.SSO_FACEBOOK, HTTP_METHOD_ENUM.POST, { locale });
      window.location.href = res?.redirectUrl!;
    } catch (err: any) {
      console.error("Facebook SSO error:", err);
      addToast({
        type: "error",
        message: err?.message || t("errors.facebookLoginFailed"),
      });
    } finally {
      loading.hide();
    }
  };

  const handleLoginWithGoogle = async () => {
    loading.show(t("social.loggingInGoogle"));
    try {
      const res = await callApi<SsoReq>(API_ROUTES.AUTH.SSO_GOOGLE, HTTP_METHOD_ENUM.POST, { locale });
      window.location.href = res?.redirectUrl!;
    } catch (err: any) {
      console.error("Google SSO error:", err);
      addToast({
        type: "error",
        message: err?.message || t("errors.googleLoginFailed"),
      });
    } finally {
      loading.hide();
    }
  };

  const handleEmailPasswordLogin = async (values: { email: string; password: string; rememberMe: boolean }) => {
    loading.show(t("loggingIn"));
    try {
      // Use silent flag to prevent alert() and only use toast
      const loginResult = await callApi<any>(
        API_ROUTES.AUTH.LOGIN,
        HTTP_METHOD_ENUM.POST,
        {
          email: values.email,
          password: values.password,
          rememberMe: values.rememberMe,
        },
        { silent: true }
      );

      // Fetch user data after successful login
      const userData = await callApi<User>(API_ROUTES.AUTH.ME, HTTP_METHOD_ENUM.GET, undefined, { silent: true });
      if (userData) {
        login(userData, null); // Token is stored in cookie, not needed in context
      }

      addToast({
        type: "success",
        message: t("loginSuccess"),
      });

      // Use router.push instead of window.location.href to avoid hard reload
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      console.error("Login error:", err);

      // Force password field to reset by changing its key
      setPasswordKey((prev) => prev + 1);

      addToast({
        type: "error",
        message: err?.message || t("errors.loginFailed"),
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
          <h2 className="text-2xl font-bold text-foreground text-balance">{t("heading")}</h2>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur text-card-foreground px-6 py-8 shadow-sm sm:px-10">
          <Form
            initialValues={{ email: "", password: "", rememberMe: false }}
            validationSchema={{
              email: { required: true, email: true },
              password: { required: true, minLength: 6 },
            }}
            onSubmit={handleEmailPasswordLogin}
            className="space-y-6"
          >
            <FormInput name="email" type="email" label={t("emailLabel")} placeholder="Enter your email" required />

            <FormInput
              key={passwordKey} // Force re-render when key changes
              name="password"
              type="password"
              label={t("passwordLabel")}
              placeholder="Enter your password"
              required
            />

            <div className="flex items-center justify-between">
              <FormCheckbox name="rememberMe" label={t("rememberMe")} />
              <Link href={`/${locale}/forgot-password`} className="text-sm text-primary hover:underline font-medium">
                {t("forgotPassword")}
              </Link>
            </div>

            <FormActions className="justify-center">
              <FormSubmitButton className="w-full">{t("signInButton")}</FormSubmitButton>
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
            <Button onClick={handleLoginWithGoogle} icon={GoogleIcon}>
              {t("social.google")}
            </Button>
            <Button onClick={handleLoginWithFacebook} icon={FacebookIcon}>
              {t("social.facebook")}
            </Button>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("dontHaveAccount")}{" "}
              <Link href={`/${locale}/register`} className="text-primary hover:underline font-medium">
                {t("signUpLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
