import { useId } from "react";

/**
 * 品牌标：彩色象征图形（青山 + 红日 + 彩虹）+ 站点字标。
 * 图形寓意：青山（稳健/根基）、红日（朝气/成长）、彩虹（多彩连接/希望）。
 * 字标文字动态取站点名（siteName），多租户通用。
 * hover：整体微放大，红日上浮放大、青山下沉、彩虹弧描出。
 */
export default function BrandLogo({
  siteName = "joho.cn",
  size = 18,
}: {
  siteName?: string;
  size?: number;
}) {
  const gid = useId().replace(/:/g, "");
  return (
    <span className="brand-logo" style={{ fontSize: size }}>
      <svg
        width={Math.round(size * 1.9)}
        height={size}
        viewBox="0 0 36 20"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#15803d" />
            <stop offset="1" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        {/* 彩虹（红/橙/绿三弧） */}
        <path
          className="brand-logo-arc"
          d="M8.5 9.5 A9 9 0 0 1 27.5 9.5"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          className="brand-logo-arc"
          d="M11.5 9.5 A6.5 6.5 0 0 1 24.5 9.5"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          className="brand-logo-arc"
          d="M14 9.5 A4 4 0 0 1 22 9.5"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* 红日 */}
        <circle className="brand-logo-sun" cx="6" cy="13" r="2.7" fill="#f97316" />
        {/* 青山 */}
        <path
          className="brand-logo-peaks"
          d="M1 20 L8.5 12.8 L15 18.5 L20.5 14 L26 19 L32 15 L36 20 Z"
          fill={`url(#${gid})`}
        />
      </svg>
      <span className="brand-logo-text">{siteName}</span>
    </span>
  );
}
