import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../domain/interfaces/iap_gateway.dart';
import '../../profile/application/profile_notifier.dart';

class SubscriptionState {
  const SubscriptionState({
    this.offerings = const [],
    this.isLoading = false,
    this.error,
  });

  final List<IapOffering> offerings;
  final bool isLoading;
  final String? error;
}

class SubscriptionNotifier extends AsyncNotifier<SubscriptionState> {
  @override
  Future<SubscriptionState> build() async {
    final iap = ref.read(iapGatewayProvider);
    final offerings = await iap.getOfferings();
    return SubscriptionState(offerings: offerings);
  }

  Future<void> purchase(String packageId) async {
    state = const AsyncLoading<SubscriptionState>().copyWithPrevious(state);
    try {
      final iap = ref.read(iapGatewayProvider);
      await iap.purchase(packageId);
      ref.invalidate(profileNotifierProvider);
    } catch (error) {
      state = AsyncData(
        SubscriptionState(
          offerings: state.value?.offerings ?? const [],
          error: error.toString(),
        ),
      );
    }
  }
}

final subscriptionNotifierProvider =
    AsyncNotifierProvider<SubscriptionNotifier, SubscriptionState>(
  SubscriptionNotifier.new,
);
