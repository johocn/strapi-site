import { useId } from "react";

/**
 * 品牌标：象征图形（朝阳 + 三重山峦 + 上升连接弧，蓝青渐变）+ 站点字标。
 * 图形寓意：朝阳初升（成长）、山峦（攀登/稳健）、向上弧线（连接/进取）。
 * 字标文字动态取站点名（siteName），多租户通用。
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
        width={Math.round(size * 1.7)}
        height={size}
        viewBox="0 0 34 20"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1a73e8" />
            <stop offset="1" stopColor="#00c6a7" />
          </linearGradient>
        </defs>
        {/* 朝阳 */}
        <circle className="brand-logo-sun" cx="21" cy="5.5" r="3.4" fill="#fff" />
        {/* 三重山峦 */}
        <path
          className="brand-logo-peaks"
          d="M1 18 L8.5 8.5 L13.5 15 L17.5 9.5 L22.5 15.5 L27 11 L33 18 Z"
          fill="#fff"
        />
        {/* 上升连接弧 */}
        <path
          className="brand-logo-arc"
          d="M6 3.5 Q13 -1.5 20 2"
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
      <span className="brand-logo-text">{siteName}</span>
    </span>
  );
}
