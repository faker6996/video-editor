import { useAuth } from "@/contexts/AuthContext";
import { FacebookIcon, GoogleIcon } from "@/components/icons/SocialIcons";
import Input from "@/components/ui/Input";
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
import { Checkbox } from "@/components/ui/CheckBox";

interface SsoReq {
  redirectUrl: string;
}

export default function LoginContainer() {
  const router = useRouter();
  const { login } = useAuth();
  const locale = useLocale();
  const t = useTranslations("LoginPage");
  const { addToast } = useToast();

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
  const handleEmailPasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const rememberMe = form.get("rememberMe") === "on";

    loading.show(t("loggingIn"));
    try {
      // Use silent flag to prevent alert() and only use toast
      const loginResult = await callApi<any>(
        API_ROUTES.AUTH.LOGIN,
        HTTP_METHOD_ENUM.POST,
        {
          email,
          password,
          rememberMe,
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
          <form className="space-y-6" onSubmit={handleEmailPasswordLogin}>
            <Input
              label={t("emailLabel")}
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-border bg-input text-foreground px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />

            <Input
              label={t("passwordLabel")}
              type="password"
              name="password"
              required
              className="mt-1 block w-full rounded-md border border-border bg-input text-foreground px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />

            <div className="flex items-center justify-between">
              <Checkbox name="rememberMe" label={<span className="text-sm text-muted-foreground">{t("rememberMe")}</span>} />
              <Link href={`/${locale}/forgot-password`} className="text-sm text-primary hover:underline font-medium">
                {t("forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full rounded-md bg-primary text-primary-foreground hover:brightness-110 font-medium shadow-sm transition"
            >
              {t("signInButton")}
            </Button>
          </form>

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
