import { HomeFavoriteNext } from "@/components/home/HomeFavoriteNext";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeLeaderboardPreview } from "@/components/home/HomeLeaderboardPreview";
import { HomeQuickLinks } from "@/components/home/HomeQuickLinks";
import { HomeTodaysMatches } from "@/components/home/HomeTodaysMatches";
import { requireAuthContext } from "@/lib/auth";
import { getLeaderboardTopN } from "@/lib/data/leaderboard";
import { getGroupStageMatches, getNextMatchForTeam } from "@/lib/data/matches";

export const metadata = { title: "Home · Cup26 Arena" };

export default async function HomePage() {
  const auth = await requireAuthContext();
  const favoriteCode = auth.profile?.favorite_team_code ?? null;
  const greeting = auth.profile?.display_name?.trim() || auth.user.email?.split("@")[0] || "there";

  const [matches, top5, nextMatch] = await Promise.all([
    getGroupStageMatches(),
    getLeaderboardTopN(5),
    favoriteCode ? getNextMatchForTeam(favoriteCode) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-12 pb-8">
      <HomeHero greetingName={greeting} hasFavoriteTeam={Boolean(favoriteCode)} />
      <HomeTodaysMatches matches={matches} />
      <HomeFavoriteNext team={auth.team} nextMatch={nextMatch} />
      <HomeLeaderboardPreview entries={top5} currentUserId={auth.user.id} />
      <HomeQuickLinks />
    </div>
  );
}
