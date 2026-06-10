import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/features/rewards/application/reward_progress.dart';

void main() {
  test('progress is capped at one unlock target', () {
    expect(RewardProgress.fromBonus(12).fraction, 0.2);
    expect(RewardProgress.fromBonus(60).fraction, 1);
    expect(RewardProgress.fromBonus(120).fraction, 1);
  });

  test('remaining bonus never becomes negative', () {
    expect(RewardProgress.fromBonus(12).remaining, 48);
    expect(RewardProgress.fromBonus(60).remaining, 0);
    expect(RewardProgress.fromBonus(120).remaining, 0);
  });
}
