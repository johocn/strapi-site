import { API_ORIGIN } from "@/lib/env";

/**
 * 站点合并配置读取（前端四级模板体系）
 *
 * 数据源：zhao-common 公开接口 GET /api/zhao-common/v1/site-config/merged
 * 返回：{ ...站点公开字段, site, templateMeta, config }，config 为模板预设+租户覆盖的合并配置
 *
 * 回退链语义：resolveConfig 从 bundle.config 起始逐级查找，
 * 任何一级 key 缺失 / 值为 null / 空串 即返回 undefined（由调用方回退到上一级或内置兜底）；
 * `false` 不算缺失（显式禁用需能被模块读到，用于 enabled:false 不渲染）。
 */

export interface SiteConfigBundle {
  /** 合并配置（模板预设 + 租户覆盖）：global / style / pages / modules 均在此 */
  config: Record<string, any>;
  /** 模板元信息（templateId / templateName / fieldConstraints / presetKeys） */
  templateMeta: any;
  /** 站点公开配置（siteName / tencentMapKey / icpNumber / domain ...） */
  site: Record<string, any>;
  [key: string]: any;
}

/**
 * 拉取当前站点合并配置（静态导出：构建期固化，一次拉取即可）。
 * 失败时返回缓存值；无缓存则返回 null（页面/模块走内置兜底渲染）。
 */
export async function getSiteConfig(siteUrl: string): Promise<SiteConfigBundle | null> {
  try {
    const res = await fetch(`${API_ORIGIN}/api/zhao-common/v1/site-config/merged`);
    if (!res.ok) return null;
    const json = await res.json();
    const data = (json?.data || json || {}) as Record<string, any>;
    const bundle: SiteConfigBundle = {
      ...data,
      site: data.site || data,
      config: data.config && typeof data.config === "object" ? data.config : {},
      templateMeta: data.templateMeta ?? null,
    };
    return bundle;
  } catch {
    return null;
  }
}

/**
 * 回退链查找：从 bundle.config 起始逐级定位 path。
 * 例：resolveConfig(bundle, ["style"]) → config.style
 *     resolveConfig(bundle, ["modules", "hero"]) → config.modules.hero
 *     resolveConfig(bundle, ["pages", "home", "modules"]) → config.pages.home.modules
 * 任一级缺失 / null / 空串 → 返回 undefined。
 */
export function resolveConfig(bundle: SiteConfigBundle | null, path: string[]): any {
  let cursor: any = bundle?.config ?? bundle;
  for (const key of path) {
    if (
      cursor &&
      typeof cursor === "object" &&
      key in cursor &&
      cursor[key] !== null &&
      cursor[key] !== ""
    ) {
      cursor = cursor[key];
    } else {
      return undefined;
    }
  }
  return cursor;
}

/** 模块显式禁用判断：resolveConfig 后再校验 enabled !== false（缺省视为启用） */
export function isModuleEnabled(bundle: SiteConfigBundle | null, path: string[]): boolean {
  const cfg = resolveConfig(bundle, path);
  return !cfg || cfg.enabled !== false;
}
