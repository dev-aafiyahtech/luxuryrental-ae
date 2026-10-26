import type { Metadata } from "next";
import { heroCars } from "@/content/cars";
import { site } from "@/content/site";
import { getLocale, getT } from "@/i18n/dictionaries";
import { alternatesFor } from "@/i18n/metadata";
import { localizeCars } from "@/content/localize";
import { getToday } from "@/lib/server-time";
import { toMinutes } from "@/lib/dates";
import { CarArt } from "@/components/car/CarArt";
import { HomeExperience } from "@/components/home/HomeExperience";
import { StageLayer } from "@/components/home/StageLayer";
import { ChapterRail } from "@/components/home/ChapterRail";
import { HomeChapters, noScriptCss, stageCallouts } from "@/components/home/Chapters";
import { AfterChapters } from "@/components/home/AfterChapters";
import { HomeDock } from "@/components/home/Islands";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getT("home"), getLocale()]);
  // The layout's "%s | LuxuryRentals.ae" template doesn't reach a page in its own segment.
  return { title: { absolute: `${t("meta.title")} | ${site.brandName}` }, description: t("meta.description"), alternates: alternatesFor(locale, "/") };
}

/**
 * Homepage: one scroll story in four chapters (Burj by Night, Velocity Tunnel, Kinetic
 * Sculpture, Reserve) over a lazy-loaded WebGL stage, then the fleet, how it works,
 * delivery, trust and FAQs. All copy is server-rendered; the stage is decoration.
 */
export default async function Home() {
  const [today, locale] = await Promise.all([getToday(), getLocale()]);
  const top = localizeCars(heroCars(), locale);
  const hero = top.find((c) => c.heroRank === 1) ?? top[0];
  // The Kinetic Sculpture's default car changes once a day, chosen here on the server from
  // the Dubai date (never at random in the browser, so there's no layout shift or mismatch).
  const day = Math.floor(toMinutes(today) / 1440);
  const defaultIndex = ((day % top.length) + top.length) % top.length;
  const arts = top.map((car) => <CarArt key={car.slug} car={car} view="side" className="aspect-[2.25/1] w-full" alt="" locale={locale} />);

  return (
    <>
      <noscript dangerouslySetInnerHTML={{ __html: `<style>${noScriptCss}</style>` }} />
      <HomeExperience
        cars={top}
        heroSlug={hero.slug}
        defaultIndex={defaultIndex}
        chrome={
          <>
            <StageLayer arts={arts} callouts={stageCallouts(top, locale)} />
            <ChapterRail />
          </>
        }
        chapters={<HomeChapters top={top} today={today} />}
        after={<AfterChapters today={today} />}
        dock={<HomeDock />}
      />
    </>
  );
}
