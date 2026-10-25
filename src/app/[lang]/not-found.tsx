import Link from "next/link";
import { getHref, getT } from "@/i18n/dictionaries";

export default async function NotFound() {
  const [t, href] = await Promise.all([getT("common"), getHref()]);
  return (
    <div className="container-site grid min-h-[60vh] content-center gap-6 py-24">
      <p className="eyebrow"><span className="num">404</span>{t("notFound.eyebrow")}</p>
      <h1 className="display-md">{t("notFound.title")}</h1>
      <p className="lede">{t("notFound.body")}</p>
      <div className="flex flex-wrap gap-3">
        <Link href={href("/cars")} className="btn btn-primary">{t("notFound.fleet")}</Link>
        <Link href={href("/")} className="btn btn-secondary">{t("notFound.home")}</Link>
      </div>
    </div>
  );
}
