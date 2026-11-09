import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import '../../core/env/env.dart';
import '../../domain/interfaces/iap_gateway.dart';

class RevenueCatIapGateway implements IapGateway {
  bool _initialized = false;

  @override
  Future<void> initialize({
    required String appleApiKey,
    required String googleApiKey,
  }) async {
    if (_initialized) {
      return;
    }
    if (appleApiKey.isEmpty && googleApiKey.isEmpty) {
      return;
    }

    final key = Platform.isIOS ? appleApiKey : googleApiKey;
    if (key.isEmpty) {
      return;
    }
    // Last line of defence: a RevenueCat test key in a release build shows
    // "Wrong API Key" and closes the app, so never configure with one.
    if (kReleaseMode && Env.isRevenueCatTestKey(key)) {
      debugPrint('RevenueCat test key ignored in a release build.');
      return;
    }
    try {
      await Purchases.configure(PurchasesConfiguration(key));
      _initialized = true;
    } on PlatformException catch (error) {
      debugPrint('RevenueCat configure failed: ${error.message}');
    }
  }

  @override
  Future<List<IapOffering>> getOfferings() async {
    if (!_initialized) {
      return [];
    }

    final offerings = await Purchases.getOfferings();
    return offerings.all.values
        .map(
          (offering) => IapOffering(
            identifier: offering.identifier,
            packages: offering.availablePackages
                .map(
                  (package) => IapPackage(
                    identifier: package.identifier,
                    priceString: package.storeProduct.priceString,
                  ),
                )
                .toList(),
          ),
        )
        .toList();
  }

  @override
  Future<bool> purchase(String packageIdentifier) async {
    if (!_initialized) {
      return false;
    }

    final offerings = await Purchases.getOfferings();
    Package? package;
    for (final offering in offerings.all.values) {
      for (final candidate in offering.availablePackages) {
        if (candidate.identifier == packageIdentifier) {
          package = candidate;
          break;
        }
      }
      if (package != null) {
        break;
      }
    }
    if (package == null) {
      return false;
    }

    try {
      final result = await Purchases.purchase(PurchaseParams.package(package));
      return result.customerInfo.entitlements.all['vip']?.isActive == true;
    } on PlatformException {
      return false;
    }
  }

  @override
  Future<bool> restorePurchases() async {
    if (!_initialized) {
      return false;
    }

    final customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.all['vip']?.isActive == true;
  }
}
