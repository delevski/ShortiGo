import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shortigo/core/providers.dart';
import 'package:shortigo/domain/interfaces/iap_gateway.dart';
import 'package:shortigo/features/subscription/application/subscription_notifier.dart';

class _MockIapGateway extends Mock implements IapGateway {}

void main() {
  test('restore purchases reports restored VIP access', () async {
    final gateway = _MockIapGateway();
    when(gateway.getOfferings).thenAnswer((_) async => []);
    when(gateway.restorePurchases).thenAnswer((_) async => true);
    final container = ProviderContainer(
      overrides: [iapGatewayProvider.overrideWithValue(gateway)],
    );
    addTearDown(container.dispose);

    await container.read(subscriptionNotifierProvider.future);
    await container
        .read(subscriptionNotifierProvider.notifier)
        .restorePurchases();

    final state = container.read(subscriptionNotifierProvider).requireValue;
    expect(state.message, 'VIP purchases restored.');
    verify(gateway.restorePurchases).called(1);
  });

  test('restore purchases reports when no VIP purchase is found', () async {
    final gateway = _MockIapGateway();
    when(gateway.getOfferings).thenAnswer((_) async => []);
    when(gateway.restorePurchases).thenAnswer((_) async => false);
    final container = ProviderContainer(
      overrides: [iapGatewayProvider.overrideWithValue(gateway)],
    );
    addTearDown(container.dispose);

    await container.read(subscriptionNotifierProvider.future);
    await container
        .read(subscriptionNotifierProvider.notifier)
        .restorePurchases();

    final state = container.read(subscriptionNotifierProvider).requireValue;
    expect(state.message, 'No active VIP purchase was found.');
  });
}
