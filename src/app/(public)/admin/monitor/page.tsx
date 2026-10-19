"use client";

import * as React from "react";
import Link from "next/link";
import type { Property } from "@/lib/types/inventory";
import type {
  AdminMonitorSummary,
  ManagedUser,
  UserAccountStatus,
  UserRole,
} from "@/lib/types/operations";
import {
  getAdminMonitorMetrics,
  getAdminUsers,
  getManagedPropertiesSnapshot,
  reconcileMissedWebhookPayment,
  runDailyRoomAccessCodeBatch,
  savePropertyInventory,
  toggleManagerPropertyAssignment,
  updateUserRole,
  updateUserStatus,
} from "@/lib/api/operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Building2,
  CheckCircle2,
  FileText,
  KeyRound,
  Lock,
  Mail,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}₫`;
}

export default function AdminMonitorPage() {
  const [simulatedRole, setSimulatedRole] = React.useState<UserRole>("ADMIN");
  const [activeTab, setActiveTab] = React.useState<
    "monitor" | "users" | "properties" | "audit"
  >("monitor");
  const [propertyFilter, setPropertyFilter] = React.useState<string>("all");

  const [metrics, setMetrics] = React.useState<AdminMonitorSummary | null>(null);
  const [forbiddenMessage, setForbiddenMessage] = React.useState<string | null>(
    null,
  );
  const [users, setUsers] = React.useState<ManagedUser[]>([]);
  const [properties, setProperties] = React.useState<Property[]>(() =>
    getManagedPropertiesSnapshot(),
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [bannerNotice, setBannerNotice] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // User search & filter (P6.3)
  const [userSearch, setUserSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");

  // Property Editor Form State (P2.2 & P2.3)
  const [editingPropertyId, setEditingPropertyId] = React.useState<
    string | undefined
  >(undefined);
  const [propName, setPropName] = React.useState("");
  const [propSlug, setPropSlug] = React.useState("");
  const [propCity, setPropCity] = React.useState("");
  const [propAddress, setPropAddress] = React.useState("");
  const [propDesc, setPropDesc] = React.useState("");
  const [propStatus, setPropStatus] = React.useState<"ACTIVE" | "INACTIVE">(
    "ACTIVE",
  );

  const refreshData = React.useCallback(async () => {
    const [mRes, uRes] = await Promise.all([
      getAdminMonitorMetrics({
        actorRole: simulatedRole,
        propertyIdFilter: propertyFilter,
      }),
      getAdminUsers(simulatedRole),
    ]);

    setProperties(getManagedPropertiesSnapshot());

    if (!mRes.ok) {
      setMetrics(null);
      setForbiddenMessage(mRes.message);
    } else {
      setMetrics(mRes.data);
      setForbiddenMessage(null);
    }

    if (uRes.ok) {
      setUsers(uRes.data);
    } else {
      setUsers([]);
    }
    setIsLoading(false);
  }, [simulatedRole, propertyFilter]);

  React.useEffect(() => {
    let active = true;
    Promise.all([
      getAdminMonitorMetrics({
        actorRole: simulatedRole,
        propertyIdFilter: propertyFilter,
      }),
      getAdminUsers(simulatedRole),
    ]).then(([mRes, uRes]) => {
      if (!active) return;
      setProperties(getManagedPropertiesSnapshot());
      if (!mRes.ok) {
        setMetrics(null);
        setForbiddenMessage(mRes.message);
      } else {
        setMetrics(mRes.data);
        setForbiddenMessage(null);
      }
      if (uRes.ok) {
        setUsers(uRes.data);
      } else {
        setUsers([]);
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [simulatedRole, propertyFilter]);

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    setBannerNotice(null);
    const res = await updateUserRole({
      targetUserId,
      newRole,
      actorRole: simulatedRole,
    });
    if (!res.ok) {
      setBannerNotice({ type: "error", text: res.message });
      return;
    }
    setBannerNotice({
      type: "success",
      text: `Đã cập nhật vai trò của ${res.data.fullName} sang ${res.data.role}.`,
    });
    await refreshData();
  };

  const handleStatusChange = async (
    targetUserId: string,
    newStatus: UserAccountStatus,
  ) => {
    setBannerNotice(null);
    const res = await updateUserStatus({
      targetUserId,
      newStatus,
      actorRole: simulatedRole,
    });
    if (!res.ok) {
      setBannerNotice({ type: "error", text: res.message });
      return;
    }
    setBannerNotice({
      type: "success",
      text: `Đã đổi trạng thái tài khoản ${res.data.email} sang ${res.data.status}.`,
    });
    await refreshData();
  };

  const handleTogglePropertyScope = async (
    managerUserId: string,
    propertyId: string,
    assign: boolean,
  ) => {
    setBannerNotice(null);
    const res = await toggleManagerPropertyAssignment({
      managerUserId,
      propertyId,
      assign,
      actorRole: simulatedRole,
    });
    if (!res.ok) {
      setBannerNotice({ type: "error", text: res.message });
      return;
    }
    setBannerNotice({
      type: "success",
      text: `${assign ? "Đã gán" : "Đã thu hồi"} chi nhánh ${propertyId} cho quản lý ${res.data.fullName}.`,
    });
    await refreshData();
  };

  const handleReconcilePayment = async (bookingId: string) => {
    setBannerNotice(null);
    const res = await reconcileMissedWebhookPayment({
      bookingId,
      actorRole: simulatedRole,
    });
    if (!res.ok) {
      setBannerNotice({ type: "error", text: res.message });
      return;
    }
    setBannerNotice({
      type: "success",
      text: `Đối soát thành công đơn #${res.data.bookingCode} -> CONFIRMED (đã cấp mã Check-in QR).`,
    });
    await refreshData();
  };

  const handleRunDailyPinBatch = async () => {
    setBannerNotice(null);
    const today = new Date().toISOString().slice(0, 10);
    const batch = await runDailyRoomAccessCodeBatch(today, {
      actorRole: simulatedRole,
    });
    setBannerNotice({
      type: "success",
      text: `Đã chạy Batch Room Access Code ngày ${today}: tạo mới ${batch.generatedCount} mã, giữ nguyên (idempotent) ${batch.skippedExistingCount} mã đang hoạt động.`,
    });
    await refreshData();
  };

  const startEditProperty = (prop?: Property) => {
    if (!prop) {
      setEditingPropertyId(undefined);
      setPropName("");
      setPropSlug("");
      setPropCity("Đà Lạt");
      setPropAddress("");
      setPropDesc("");
      setPropStatus("ACTIVE");
      return;
    }
    setEditingPropertyId(prop.id);
    setPropName(prop.name);
    setPropSlug(prop.slug);
    setPropCity(prop.city);
    setPropAddress(prop.address);
    setPropDesc(prop.description);
    setPropStatus(prop.status);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerNotice(null);
    const res = await savePropertyInventory({
      actorRole: simulatedRole,
      assignedPropertyIds: properties.map((p) => p.id),
      property: {
        id: editingPropertyId,
        name: propName,
        slug: propSlug,
        city: propCity,
        address: propAddress,
        description: propDesc,
        checkInTime: "14:00",
        checkOutTime: "11:00",
        status: propStatus,
      },
    });
    if (!res.ok) {
      setBannerNotice({ type: "error", text: res.message });
      return;
    }
    setBannerNotice({
      type: "success",
      text: editingPropertyId
        ? `Đã cập nhật chi nhánh "${res.data.name}" thành công.`
        : `Đã tạo mới chi nhánh "${res.data.name}" (${res.data.slug}).`,
    });
    startEditProperty(undefined);
    await refreshData();
  };

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const q = userSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, roleFilter, userSearch]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 py-8">
        <Skeleton className="h-12 w-80 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20">
      {/* Header & Role Guard Simulator */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-border/60 pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-semibold uppercase tracking-wider">
              Stage 2, 6 & 7 · Owner Admin Center
            </Badge>
            <Badge className="border border-border bg-surface text-[10px] font-mono text-muted-foreground">
              RBAC Guard: ADMIN Only
            </Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground">
            System monitor &{" "}
            <span className="font-script text-4xl sm:text-5xl lg:text-6xl text-[#C48443] font-normal not-italic px-1 inline-block -rotate-1 align-baseline">
              insights.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Trung tâm giám sát vận hành toàn hệ thống, phân quyền Manager theo
            chi nhánh (Property Scope), quản lý danh mục Homestay và nhật ký
            bảo mật (`audit_logs`).
          </p>
        </div>

        {/* Quick Links & RBAC Simulator */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-surface p-1 text-xs">
            <span className="px-2.5 text-[11px] font-medium text-muted-foreground">
              Giả lập Role:
            </span>
            {(["ADMIN", "MANAGER", "USER"] as UserRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSimulatedRole(role)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold transition-all",
                  simulatedRole === role
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {role}
              </button>
            ))}
          </div>

          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/admin/booking-config">
              <Wrench className="mr-1.5 h-3.5 w-3.5" />
              <span>Cấu hình Phòng & Giá</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 403 Forbidden Guard Banner when non-ADMIN visits /admin/monitor */}
      {forbiddenMessage && (
        <div
          role="alert"
          className="rounded-3xl border border-red-200 bg-red-50/90 p-8 text-center space-y-4"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <Badge className="bg-red-700 text-white border-none text-[10px] uppercase">
              HTTP 403 FORBIDDEN · RBAC Guard
            </Badge>
            <h2 className="text-heading text-2xl font-medium text-red-950">
              Truy cập bị từ chối đối với vai trò {simulatedRole}
            </h2>
            <p className="text-xs sm:text-sm text-red-800 max-w-lg mx-auto">
              {forbiddenMessage}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              onClick={() => setSimulatedRole("ADMIN")}
              className="rounded-full"
            >
              Chuyển lại sang vai trò ADMIN
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/manager">Sang trang Manager Console (/manager)</Link>
            </Button>
          </div>
        </div>
      )}

      {bannerNotice && (
        <div
          role="status"
          className={cn(
            "rounded-2xl border px-4 py-3 text-xs font-medium flex items-center justify-between gap-3",
            bannerNotice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          <span>{bannerNotice.text}</span>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="text-[11px] underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Main Content when ADMIN is active */}
      {metrics && !forbiddenMessage && (
        <>
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {[
                {
                  id: "monitor" as const,
                  label: "1. System Monitor & KPI (P6.5/P6.6)",
                  icon: Activity,
                },
                {
                  id: "users" as const,
                  label: `2. Users & Phân quyền Manager (${users.length})`,
                  icon: Users,
                },
                {
                  id: "properties" as const,
                  label: `3. Chi nhánh Homestay (${properties.length})`,
                  icon: Building2,
                },
                {
                  id: "audit" as const,
                  label: `4. Audit Logs & Email Outbox (${metrics.auditLogs.length})`,
                  icon: FileText,
                },
              ].map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border border-border/80 bg-surface text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Property Filter for Monitor */}
            {activeTab === "monitor" && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-medium">
                  Lọc theo cơ sở:
                </span>
                <select
                  aria-label="Lọc số liệu theo chi nhánh"
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value)}
                  className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground"
                >
                  <option value="all">Toàn hệ thống ({properties.length} cơ sở)</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* TAB 1: SYSTEM MONITOR DASHBOARD (P6.5, P6.6, P7.6) */}
          {activeTab === "monitor" && (
            <div className="space-y-8">
              {/* KPI Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Người dùng & Nhân sự</span>
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {metrics.totalUsers} tài khoản
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {metrics.totalAdmins} Admin · {metrics.totalManagers} Manager
                  </p>
                </div>

                <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Kho phòng vật lý</span>
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {metrics.activeRooms}/{metrics.totalRooms} phòng mở
                  </p>
                  <p className="text-[11px] text-amber-700 font-medium">
                    {metrics.blockedRooms} phòng đang tạm khóa bảo trì
                  </p>
                </div>

                <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Đơn đang hoạt động</span>
                    <Activity className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {metrics.activeBookingsCount} đơn
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    CONFIRMED: {metrics.bookingsByStatus.CONFIRMED ?? 0} · CHECKED_IN:{" "}
                    {metrics.bookingsByStatus.CHECKED_IN ?? 0}
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/50 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-emerald-800 font-medium">
                    <span>Doanh thu mô phỏng (PAID)</span>
                    <TrendingUp className="h-4 w-4 text-emerald-700" />
                  </div>
                  <p className="text-price text-2xl font-bold text-emerald-950 tabular-nums">
                    {formatVnd(metrics.simulatedRevenueVnd)}
                  </p>
                  <p className="text-[10px] text-emerald-800">
                    {metrics.revenueLabel}
                  </p>
                </div>
              </div>

              {/* Trend & Status Breakdown Row */}
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                {/* Daily Trend */}
                <div className="rounded-3xl border border-border/80 bg-surface p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                        System Trend · P6.5
                      </span>
                      <h2 className="text-heading text-lg font-medium text-foreground">
                        Xu hướng đặt phòng & Doanh thu mô phỏng (5 ngày)
                      </h2>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRunDailyPinBatch}
                      className="rounded-full text-xs"
                    >
                      <KeyRound className="mr-1.5 h-3.5 w-3.5 text-primary" />
                      <span>Chạy Batch PIN hôm nay (P2.8)</span>
                    </Button>
                  </div>

                  <div className="space-y-3 pt-2">
                    {metrics.dailyTrend.map((pt) => {
                      const widthPct = Math.min(
                        100,
                        Math.max(15, Math.round((pt.simulatedRevenueVnd / 4500000) * 100)),
                      );
                      return (
                        <div key={pt.date} className="space-y-1 text-xs">
                          <div className="flex justify-between font-medium">
                            <span>
                              {pt.label} ({pt.bookingsCount} đơn)
                            </span>
                            <span className="font-mono font-semibold text-primary">
                              {formatVnd(pt.simulatedRevenueVnd)}
                            </span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="rounded-3xl border border-border/80 bg-surface p-6 space-y-4">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Lifecycle Distribution · P6.6
                    </span>
                    <h2 className="text-heading text-lg font-medium text-foreground">
                      Phân bổ trạng thái đơn đặt phòng
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(metrics.bookingsByStatus).map(
                      ([status, count]) => (
                        <div
                          key={status}
                          className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 flex items-center justify-between"
                        >
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {status}
                          </span>
                          <span className="text-base font-bold text-foreground tabular-nums">
                            {count}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Latest Bookings & Payment Reconciliation (P7.6) */}
              <div className="rounded-3xl border border-border/80 bg-surface p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Reconciliation & Live Feed · P7.6
                    </span>
                    <h2 className="text-heading text-lg font-medium text-foreground">
                      Đơn đặt phòng gần đây & Đối soát Webhook thanh toán
                    </h2>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Hiển thị {metrics.latestBookings.length} đơn mới nhất
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-[11px] uppercase text-muted-foreground">
                        <th className="py-2.5 pr-4">Mã đơn</th>
                        <th className="py-2.5 pr-4">Khách hàng</th>
                        <th className="py-2.5 pr-4">Phòng / Cơ sở</th>
                        <th className="py-2.5 pr-4">Trạng thái</th>
                        <th className="py-2.5 pr-4">Tổng tiền</th>
                        <th className="py-2.5 text-right">Hành động đối soát (P7.6)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {metrics.latestBookings.map((b) => (
                        <tr key={b.id}>
                          <td className="py-3 pr-4 font-mono font-semibold">
                            #{b.bookingCode}
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-foreground">
                              {b.guestName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {b.guestEmail}
                            </p>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-foreground">
                              {b.roomNumber} · {b.roomName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {b.propertyName}
                            </p>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge className="border border-border bg-surface text-foreground text-[10px] font-mono">
                              {b.status}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 font-semibold tabular-nums">
                            {formatVnd(b.totalAmount)}
                          </td>
                          <td className="py-3 text-right">
                            {b.status === "PENDING_PAYMENT" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReconcilePayment(b.id)}
                                className="rounded-full text-[11px] h-7"
                              >
                                <RefreshCw className="mr-1 h-3 w-3" />
                                <span>Reconcile → CONFIRMED</span>
                              </Button>
                            ) : (
                              <Link
                                href={`/booking/checkout/${b.id}`}
                                className="text-primary hover:underline font-medium"
                              >
                                Xem chi tiết →
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS & MANAGER-PROPERTY ASSIGNMENT (P6.3 & P6.4) */}
          {activeTab === "users" && (
            <div className="rounded-3xl border border-border/80 bg-surface p-6 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    RBAC & Property Scope · P6.3 & P6.4
                  </span>
                  <h2 className="text-heading text-xl font-medium text-foreground">
                    Quản lý tài khoản & Phân quyền Chi nhánh cho Manager
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="h-9 w-56 rounded-full border border-border bg-surface px-3.5 text-xs text-foreground"
                  />
                  <select
                    aria-label="Lọc theo vai trò"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-9 rounded-full border border-border bg-surface px-3 text-xs font-medium"
                  >
                    <option value="ALL">Tất cả Role</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="USER">USER</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {u.fullName}
                        </span>
                        <Badge
                          className={cn(
                            "border-none text-[10px] font-semibold",
                            u.role === "ADMIN"
                              ? "bg-purple-100 text-purple-900"
                              : u.role === "MANAGER"
                              ? "bg-blue-100 text-blue-900"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {u.role}
                        </Badge>
                        <Badge
                          className={cn(
                            "border-none text-[10px]",
                            u.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-red-100 text-red-800",
                          )}
                        >
                          {u.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {u.email} · {u.phone}
                      </p>

                      {/* Manager Property Scope Assignment Pills (P6.4) */}
                      {(u.role === "MANAGER" || u.role === "ADMIN") && (
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Phạm vi chi nhánh (`manager_properties`):
                          </span>
                          {properties.map((p) => {
                            const assigned = u.assignedPropertyIds.includes(p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                disabled={u.role === "ADMIN"}
                                onClick={() =>
                                  handleTogglePropertyScope(u.id, p.id, !assigned)
                                }
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-all",
                                  assigned
                                    ? "bg-emerald-700 text-white"
                                    : "border border-border bg-surface text-muted-foreground hover:text-foreground",
                                )}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>
                                  {p.name} ({assigned ? "Đã gán" : "Chưa gán"})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Role & Status Controls (P6.3) */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        aria-label={`Đổi vai trò cho ${u.fullName}`}
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value as UserRole)
                        }
                        className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium"
                      >
                        <option value="USER">Role: USER</option>
                        <option value="MANAGER">Role: MANAGER</option>
                        <option value="ADMIN">Role: ADMIN</option>
                      </select>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleStatusChange(
                            u.id,
                            u.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                          )
                        }
                        className="rounded-full text-xs"
                      >
                        {u.status === "ACTIVE" ? (
                          <>
                            <Lock className="mr-1.5 h-3.5 w-3.5 text-red-600" />
                            <span>Khóa (DISABLE)</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                            <span>Mở khóa (ACTIVE)</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PROPERTY INVENTORY CRUD (P2.2 & P2.3) */}
          {activeTab === "properties" && (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
              <div className="rounded-3xl border border-border/80 bg-surface p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Homestay Branches · P2.2 & P2.3
                  </span>
                  <h2 className="text-heading text-xl font-medium text-foreground">
                    Danh sách chi nhánh Lumora ({properties.length})
                  </h2>
                </div>

                <div className="space-y-3">
                  {properties.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-border/70 p-4 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {p.name}
                          </span>
                          <Badge className="border border-border bg-surface text-foreground text-[10px] font-mono">
                            /{p.slug}
                          </Badge>
                          <Badge
                            className={cn(
                              "border-none text-[10px]",
                              p.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {p.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {p.city} · {p.address}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Giờ chuẩn: Check-in {p.checkInTime} / Check-out{" "}
                          {p.checkOutTime}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditProperty(p)}
                        className="rounded-full text-xs shrink-0"
                      >
                        Sửa
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create / Edit Property Form */}
              <form
                onSubmit={handleSaveProperty}
                className="rounded-3xl border border-border/80 bg-surface p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {editingPropertyId ? "Chỉnh sửa cơ sở" : "Tạo cơ sở mới"}
                    </span>
                    <h3 className="text-heading text-lg font-medium text-foreground">
                      {editingPropertyId
                        ? `Cập nhật ${propName}`
                        : "Thêm chi nhánh Homestay mới"}
                    </h3>
                  </div>
                  {editingPropertyId && (
                    <button
                      type="button"
                      onClick={() => startEditProperty(undefined)}
                      className="text-xs text-primary underline"
                    >
                      + Tạo mới
                    </button>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label htmlFor="prop-name" className="font-semibold text-foreground">
                      Tên chi nhánh
                    </label>
                    <input
                      id="prop-name"
                      type="text"
                      required
                      value={propName}
                      onChange={(e) => setPropName(e.target.value)}
                      placeholder="VD: Lumora Hội An Sanctuary"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="prop-slug" className="font-semibold text-foreground">
                        Slug duy nhất (Unique)
                      </label>
                      <input
                        id="prop-slug"
                        type="text"
                        required
                        value={propSlug}
                        onChange={(e) => setPropSlug(e.target.value)}
                        placeholder="lumora-hoi-an"
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="prop-city" className="font-semibold text-foreground">
                        Thành phố
                      </label>
                      <input
                        id="prop-city"
                        type="text"
                        required
                        value={propCity}
                        onChange={(e) => setPropCity(e.target.value)}
                        placeholder="Hội An"
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="prop-address" className="font-semibold text-foreground">
                      Địa chỉ
                    </label>
                    <input
                      id="prop-address"
                      type="text"
                      required
                      value={propAddress}
                      onChange={(e) => setPropAddress(e.target.value)}
                      placeholder="Số 12 Nguyễn Thái Học..."
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="prop-desc" className="font-semibold text-foreground">
                      Mô tả ngắn
                    </label>
                    <input
                      id="prop-desc"
                      type="text"
                      value={propDesc}
                      onChange={(e) => setPropDesc(e.target.value)}
                      placeholder="Không gian nghỉ dưỡng di sản..."
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="prop-status" className="font-semibold text-foreground">
                      Trạng thái vận hành
                    </label>
                    <select
                      id="prop-status"
                      value={propStatus}
                      onChange={(e) =>
                        setPropStatus(e.target.value as "ACTIVE" | "INACTIVE")
                      }
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs"
                    >
                      <option value="ACTIVE">ACTIVE · Đang mở đặt phòng</option>
                      <option value="INACTIVE">INACTIVE · Tạm ngưng</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" className="w-full rounded-full">
                  <Plus className="mr-1.5 h-4 w-4" />
                  <span>
                    {editingPropertyId
                      ? "Lưu cập nhật chi nhánh"
                      : "Tạo chi nhánh mới"}
                  </span>
                </Button>
              </form>
            </div>
          )}

          {/* TAB 4: SECURITY AUDIT LOGS & EMAIL OUTBOX (P6.8 & P7.10) */}
          {activeTab === "audit" && (
            <div className="grid gap-6 lg:grid-cols-2 items-start">
              {/* Security Audit Logs */}
              <div className="rounded-3xl border border-border/80 bg-surface p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Security Audit Logs · P6.8
                    </span>
                    <h2 className="text-heading text-lg font-medium text-foreground">
                      Nhật ký thao tác nhạy cảm (Zero Plaintext PIN)
                    </h2>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>

                {metrics.auditLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    Chưa có bản ghi audit log nào trong phiên này. Hãy thử đổi
                    Role, gán chi nhánh hoặc chạy Batch PIN.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {metrics.auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className="border border-border bg-surface text-foreground text-[10px] font-mono font-semibold">
                            {log.action}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(log.createdAt).toLocaleTimeString("vi-VN")}
                          </span>
                        </div>
                        <p className="font-medium text-foreground">
                          {log.metadataSummary}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Actor: {log.actorName} ({log.actorRole}) · Entity:{" "}
                          {log.entityType} #{log.entityId}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Email Notification Outbox (P7.10) */}
              <div className="rounded-3xl border border-border/80 bg-surface p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Idempotent Email Outbox · P7.10
                    </span>
                    <h2 className="text-heading text-lg font-medium text-foreground">
                      Hàng đợi thông báo Email đã gửi
                    </h2>
                  </div>
                  <Mail className="h-5 w-5 text-primary" />
                </div>

                {metrics.emailEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    Chưa có email sự kiện nào phát sinh. Khi xác nhận thanh toán
                    hoặc hủy phòng, email sẽ được ghi nhận chống gửi trùng tại
                    đây.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {metrics.emailEvents.map((em) => (
                      <div
                        key={em.id}
                        className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className="bg-emerald-100 text-emerald-900 border-none text-[10px]">
                            {em.template} · {em.status}
                          </Badge>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Key: {em.idempotencyKey}
                          </span>
                        </div>
                        <p className="font-semibold text-foreground">
                          {em.subject}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          To: {em.recipientEmail}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
