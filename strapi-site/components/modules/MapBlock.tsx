import { resolveConfig, type SiteConfigBundle } from "@/lib/site-config";

type MapBlockProps = {
  bundle: SiteConfigBundle | null;
  /** 经纬度字符串（seo-config.geoPosition），兼容 "39.90,116.40" 与 "39.90;116.40" */
  geoPosition?: string;
  geoPlacename?: string;
};

/**
 * 四级模块：地图块。
 * 渲染条件（全满足才渲染）：config.modules.map.enabled === true
 *   + tencentMapKey（站点配置 site.tencentMapKey）
 *   + geoPosition（seo-config）
 * 本期最简可运行形态：坐标卡片 + 腾讯地图 URI 外链（不内嵌 iframe，规避 X-Frame-Options）。
 */
export default function MapBlock({ bundle, geoPosition, geoPlacename }: MapBlockProps) {
  const cfg = resolveConfig(bundle, ["modules", "map"]) || {};
  if (cfg.enabled !== true) return null;

  const tencentMapKey =
    bundle?.site?.tencentMapKey || bundle?.tencentMapKey || "";
  if (!tencentMapKey || !geoPosition) return null;

  const coords = String(geoPosition)
    .split(/[;,]/)
    .map((s) => s.trim());
  if (coords.length < 2 || !coords[0] || !coords[1]) return null;
  const [lat, lng] = coords;

  const uri = `https://apis.map.qq.com/uri/v1/marker?marker=coord:${lat},${lng};title:${encodeURIComponent(
    geoPlacename || "位置"
  )}&referer=${encodeURIComponent(tencentMapKey)}`;

  return (
    <section className="map-block">
      <h2>{geoPlacename || "地理位置"}</h2>
      <div className="map-block-body">
        <p className="map-block-coords">
          {lat}, {lng}
        </p>
        <a href={uri} target="_blank" rel="noreferrer" className="map-block-link">
          在腾讯地图中查看
        </a>
      </div>
    </section>
  );
}
