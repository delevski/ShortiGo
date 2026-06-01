import '../../domain/entities/user.dart';

abstract class UserRepository {
  Future<AppUser> byId(String id);
  Stream<AppUser> watch(String id);
  Future<void> createIfMissing(AppUser user);
  Future<void> setDailyCheckIn(String userId, DateTime at);
}
