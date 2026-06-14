import { useAuth } from "../../app/AuthContext";
import { useToast } from "../../components/Toast";
import { auth, db, rewardApiBaseUrl } from "../../firebase/firebase";
import { claimDailyCheckIn, grantWebAdReward } from "../../repositories/rewardsRepository";

export function RewardsPage() {
  const { appUser, authUser } = useAuth();
  const { showToast } = useToast();

  const claimDaily = async () => {
    if (!authUser || !auth || !db) {
      showToast("Log in to claim rewards.", "error");
      return;
    }
    try {
      await claimDailyCheckIn({ auth, db, userId: authUser.uid, rewardApiBaseUrl });
      showToast("Daily bonus claimed.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to claim daily bonus.", "error");
    }
  };

  const claimWebReward = async () => {
    if (!authUser || !db) {
      showToast("Log in to claim rewards.", "error");
      return;
    }
    try {
      await grantWebAdReward(db, authUser.uid);
      showToast("Web reward added.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to claim web reward.", "error");
    }
  };

  return (
    <section className="page-surface rewards-grid">
      <h1>Rewards</h1>
      <article className="reward-card">
        <h2>Daily check-in</h2>
        <p>Current bonus: {appUser?.bonus ?? 0}</p>
        <button className="primary-pill" type="button" onClick={() => void claimDaily()}>Claim daily bonus</button>
      </article>
      <article className="reward-card">
        <h2>Web reward</h2>
        <p>Use this web-safe reward until a browser ad provider is configured.</p>
        <button className="wallet-pill" type="button" onClick={() => void claimWebReward()}>Claim web reward</button>
      </article>
    </section>
  );
}
