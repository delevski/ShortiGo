class AppConfig {
  const AppConfig({
    required this.dailyAdCap,
    required this.vipPriceMonthly,
  });

  final int dailyAdCap;
  final double vipPriceMonthly;

  static const defaults = AppConfig(
    dailyAdCap: 50,
    vipPriceMonthly: 4.99,
  );
}

abstract class AdminConfigGateway {
  Future<AppConfig> get();
  Stream<AppConfig> watch();
}
