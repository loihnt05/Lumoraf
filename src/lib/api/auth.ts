import { apiRequest } from "./client";

export type BackendUserProfile = {
  id: string;
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: "ADMIN" | "MANAGER" | "USER";
  status: "ACTIVE" | "DISABLED";
  createdAt?: string;
  updatedAt?: string;
};

export type AuthResponse = {
  token: string;
  user: BackendUserProfile;
};

export type DemoAccount = {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "MANAGER" | "USER";
  roleLabel: string;
  description: string;
};

export async function loginWithEmail(email: string, password?: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
}

export async function registerUser(
  email: string,
  fullName: string,
  phone?: string,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), fullName: fullName.trim(), phone }),
  });
}

export async function getDemoAccounts(): Promise<DemoAccount[]> {
  try {
    return await apiRequest<DemoAccount[]>("/api/auth/demo-accounts");
  } catch {
    return [
      {
        id: "e0000001-0000-0000-0000-000000000001",
        email: "owner@lumora.vn",
        fullName: "Nguyễn Hồng Lợi",
        role: "ADMIN",
        roleLabel: "Quản trị viên toàn hệ thống (Admin)",
        description: "Toàn quyền quản trị, cấu hình giá/phòng, giám sát hệ thống",
      },
      {
        id: "e0000002-0000-0000-0000-000000000001",
        email: "manager.dalat@lumora.vn",
        fullName: "Trần Minh Quân",
        role: "MANAGER",
        roleLabel: "Quản lý chi nhánh Đà Lạt",
        description: "Phụ trách vận hành, nhận/trả phòng tại chi nhánh Đà Lạt",
      },
      {
        id: "e0000002-0000-0000-0000-000000000002",
        email: "manager.saigon@lumora.vn",
        fullName: "Lê Thu Hà",
        role: "MANAGER",
        roleLabel: "Quản lý chi nhánh Sài Gòn",
        description: "Phụ trách vận hành, nhận/trả phòng tại chi nhánh Sài Gòn",
      },
      {
        id: "e0000003-0000-0000-0000-000000000001",
        email: "loitn@lumora.vn",
        fullName: "Lợi Trần",
        role: "USER",
        roleLabel: "Khách hàng thân thiết",
        description: "Khách hàng thân thiết có lịch sử booking đã hoàn thành",
      },
    ];
  }
}

export async function getAuthMe(token?: string): Promise<BackendUserProfile> {
  return apiRequest<BackendUserProfile>("/api/me", { token });
}
