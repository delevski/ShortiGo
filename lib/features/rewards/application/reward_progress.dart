class RewardProgress {
  const RewardProgress({
    required this.bonus,
    required this.unlockCost,
  });

  factory RewardProgress.fromBonus(int bonus, {int unlockCost = 60}) {
    return RewardProgress(bonus: bonus, unlockCost: unlockCost);
  }

  final int bonus;
  final int unlockCost;

  double get fraction => (bonus / unlockCost).clamp(0, 1).toDouble();
  int get remaining => (unlockCost - bonus).clamp(0, unlockCost);
}
