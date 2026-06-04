import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shortigo/core/providers.dart';
import 'package:shortigo/domain/interfaces/iap_gateway.dart';
import 'package:shortigo/features/subscription/presentation/subscribe_page.dart';

class _MockIapGateway extends Mock implements IapGateway {}

void main() {
  testWidgets('subscription page offers purchase restoration', (tester) async {
    final gateway = _MockIapGateway();
    when(gateway.getOfferings).thenAnswer((_) async => []);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [iapGatewayProvider.overrideWithValue(gateway)],
        child: const MaterialApp(home: SubscribePage()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Restore purchases'), findsOneWidget);
  });
}
