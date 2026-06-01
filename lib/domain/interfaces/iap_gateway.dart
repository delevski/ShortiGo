class IapOffering {
  IapOffering({
    required this.identifier,
    required this.packages,
  });

  final String identifier;
  final List<IapPackage> packages;
}

class IapPackage {
  IapPackage({
    required this.identifier,
    required this.priceString,
  });

  final String identifier;
  final String priceString;
}

abstract class IapGateway {
  Future<void> initialize({
    required String appleApiKey,
    required String googleApiKey,
  });

  Future<List<IapOffering>> getOfferings();
  Future<bool> purchase(String packageIdentifier);
}
