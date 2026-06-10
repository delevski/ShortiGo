import '../../../domain/entities/episode.dart';
import '../../../domain/entities/user.dart';

enum EpisodeAccessState { open, vipRequired, bonusRequired }

EpisodeAccessState accessFor(Episode episode, AppUser? user) {
  if (episode.isVipLocked && !(user?.isVip ?? false)) {
    return EpisodeAccessState.vipRequired;
  }
  if (episode.canUnlockWithBonus &&
      !(user?.unlockedEpisodeIds.contains(episode.id) ?? false)) {
    return EpisodeAccessState.bonusRequired;
  }
  return EpisodeAccessState.open;
}
