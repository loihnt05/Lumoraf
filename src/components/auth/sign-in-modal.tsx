"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { getDemoAccounts, type DemoAccount } from "@/lib/api/auth";
import { ShieldCheck, UserCheck, KeyRound, AlertCircle, ArrowRight, UserPlus, CheckCircle2 } from "lucide-react";

export function SignInModal() {
  const { isSignInModalOpen, closeSignInModal, login, register, isLoading } = useAuth();
  const [mode, setMode] = React.useState<"demo" | "email" | "register">("demo");
  const [demoAccounts, setDemoAccounts] = React.useState<DemoAccount[]>([]);
  const [emailInput, setEmailInput] = React.useState("");
  const [passwordInput, setPasswordInput] = React.useState("");
  const [registerName, setRegisterName] = React.useState("");
  const [registerEmail, setRegisterEmail] = React.useState("");
  const [registerPhone, setRegisterPhone] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isSignInModalOpen) {
      setErrorMessage(null);
      getDemoAccounts().then(setDemoAccounts).catch(() => {});
    }
  }, [isSignInModalOpen]);

  const handleLoginDemo = async (email: string) => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await login(email);
      closeSignInModal();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await login(emailInput.trim(), passwordInput);
      closeSignInModal();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng kiểm tra lại email.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail.trim() || !registerName.trim()) return;
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await register(registerEmail.trim(), registerName.trim(), registerPhone.trim());
      closeSignInModal();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Đăng ký thất bại. Email có thể đã tồn tại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isSignInModalOpen} onOpenChange={(open) => !open && closeSignInModal()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="space-y-1.5 text-center sm:text-left">
          <p className="text-caption uppercase tracking-[0.2em] text-primary">Lumora Authentication</p>
          <DialogTitle className="text-display text-2xl font-normal tracking-tight">
            Đăng nhập hệ thống
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Xác thực trực tiếp với Spring Boot Backend (`Lumorab`) và PostgreSQL. Không dùng dữ liệu giả lập.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="mt-2 flex rounded-lg border border-border/80 bg-muted/40 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("demo");
              setErrorMessage(null);
            }}
            className={`flex-1 rounded-md py-1.5 transition-all ${
              mode === "demo" ? "bg-surface font-semibold text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tài khoản mẫu (1-Click)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("email");
              setErrorMessage(null);
            }}
            className={`flex-1 rounded-md py-1.5 transition-all ${
              mode === "email" ? "bg-surface font-semibold text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Email & Mật khẩu
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMessage(null);
            }}
            className={`flex-1 rounded-md py-1.5 transition-all ${
              mode === "register" ? "bg-surface font-semibold text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Đăng ký mới
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* MODE 1: DEMO ACCOUNTS QUICK LOGIN */}
        {mode === "demo" && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Chọn nhanh một tài khoản đã seed trong PostgreSQL để kiểm thử phân quyền:
            </p>
            <div className="grid gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  disabled={submitting || isLoading}
                  onClick={() => handleLoginDemo(account.email)}
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-surface p-3 text-left transition-all hover:border-primary/60 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{account.fullName}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide ${
                          account.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : account.role === "MANAGER"
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {account.role}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{account.email}</p>
                    <p className="text-[11px] text-muted-foreground/80">{account.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MODE 2: CUSTOM EMAIL LOGIN */}
        {mode === "email" && (
          <form onSubmit={handleCustomLogin} className="mt-3 space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Email đăng nhập</label>
              <input
                type="email"
                required
                placeholder="ví dụ: owner@lumora.vn"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Mật khẩu (Tùy chọn cho local dev)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || isLoading}
              className="h-11 w-full gap-2 rounded-full font-medium"
            >
              <KeyRound className="h-4 w-4" />
              {submitting ? "Đang xác thực với BE…" : "Đăng nhập Backend"}
            </Button>
          </form>
        )}

        {/* MODE 3: REGISTER NEW USER */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="mt-3 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Họ và tên</label>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Email</label>
              <input
                type="email"
                required
                placeholder="vana@gmail.com"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Số điện thoại</label>
              <input
                type="tel"
                placeholder="0912345678"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || isLoading}
              className="mt-1 h-11 w-full gap-2 rounded-full font-medium"
            >
              <UserPlus className="h-4 w-4" />
              {submitting ? "Đang tạo tài khoản trong PostgreSQL…" : "Đăng ký tài khoản mới"}
            </Button>
          </form>
        )}

        <div className="rounded-xl bg-muted/50 p-3 text-center text-[11px] text-muted-foreground">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Mỗi lượt đăng nhập tạo JWT Bearer Token lưu vào localStorage và tự động đính kèm mọi API call.</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
