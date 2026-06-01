import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/core/error/friendly_error.dart';
import 'package:shortigo/shared/widgets/error_view.dart';

void main() {
  testWidgets('ErrorView shows title, message, and retry button', (tester) async {
    var retried = false;
    await tester.pumpWidget(
      MaterialApp(
        home: ErrorView(
          error: const FriendlyError(
            title: 'No connection',
            message: 'Try wifi',
          ),
          onRetry: () => retried = true,
        ),
      ),
    );
    expect(find.text('No connection'), findsOneWidget);
    expect(find.text('Try wifi'), findsOneWidget);
    await tester.tap(find.text('Try again'));
    expect(
      retried,
      isTrue,
    );
  });
}
