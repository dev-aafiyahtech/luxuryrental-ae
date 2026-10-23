import type { Metadata } from "next";
import { heroCars } from "@/content/cars";
import { getT } from "@/i18n/dictionaries";
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
  const t = await getT("home");
  return { title: t("meta.title"), description: t("meta.description") };
}

/**
 * Homepage: one scroll story in four chapters (Burj by Night, Velocity Tunnel, Kinetic
 * Sculpture, Reserve) over a lazy-loaded WebGL stage, then the fleet, how it works,
 * delivery, trust and FAQs. All copy is server-rendered; the stage is decoration.
 */
export default async function Home() {
  const today = await getToday();
  const top = heroCars();
  const hero = top.find((c) => c.heroRank === 1) ?? top[0];
  // The Kinetic Sculpture's default car changes once a day, chosen here on the server from
  // the Dubai date (never at random in the browser, so there's no layout shift or mismatch).
  const day = Math.floor(toMinutes(today) / 1440);
  const defaultIndex = ((day % top.length) + top.length) % top.length;
  const arts = top.map((car) => <CarArt key={car.slug} car={car} view="side" className="aspect-[2.25/1] w-full" alt="" />);

  return (
    <>
      <noscript dangerouslySetInnerHTML={{ __html: `<style>${noScriptCss}</style>` }} />
      <HomeExperience
        cars={top}
        heroSlug={hero.slug}
        defaultIndex={defaultIndex}
        chrome={
          <>
            <StageLayer arts={arts} callouts={stageCallouts(top)} />
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
