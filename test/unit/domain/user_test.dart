import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/domain/entities/user.dart';

void main() {
  test('AppUser round-trips', () {
    final user = AppUser(
      id: 'u1',
      email: 'a@b.com',
      createdAt: DateTime.utc(2026, 1, 1),
    );

    expect(AppUser.fromJson(user.toJson()), equals(user));
  });

  test('coins defaults to 0', () {
    final user = AppUser(
      id: 'u',
      email: 'a',
      createdAt: DateTime.utc(2026),
    );

    expect(user.coins, 0);
    expect(user.bonus, 0);
    expect(user.isVip, isFalse);
  });
}
