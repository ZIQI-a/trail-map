import type { AppUserDto } from "../../types/auth";

// 统一格式化后台展示时间，避免不同模块重复拼接日期文本。
export function formatAdminDateTime(value?: string | null) {
  if (!value) {
    return "暂无记录";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

// 管理端统一使用同一套角色文案与标签颜色。
export function getAdminUserRoleMeta(userType: AppUserDto["userType"]) {
  switch (userType) {
    case "admin":
      return { label: "管理员", tagColor: "blue" as const };
    case "member":
      return { label: "会员", tagColor: "purple" as const };
    default:
      return { label: "普通用户", tagColor: "default" as const };
  }
}
