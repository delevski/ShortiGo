import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/app.dart';
import 'package:shortigo/core/router/app_router.dart';

void main() {
  testWidgets('starts on Discover and navigates with bottom tabs', (
    tester,
  ) async {
    await tester.pumpWidget(ShortiGoApp(router: buildRouter()));
    await tester.pumpAndSettle();

    expect(find.text('Discover'), findsWidgets);

    await tester.tap(find.text('Shorts'));
    await tester.pumpAndSettle();

    expect(find.text('Shorts'), findsWidgets);

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();

    expect(find.text('Profile'), findsWidgets);
  });
}
