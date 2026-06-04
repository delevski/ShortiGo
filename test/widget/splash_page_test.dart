import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/features/splash/presentation/shortigo_vortex_splash.dart';
import 'package:shortigo/features/splash/presentation/splash_page.dart';

void main() {
  test('splash animation stays within the startup target', () {
    expect(
      SplashPage.animationDuration,
      lessThanOrEqualTo(const Duration(milliseconds: 1500)),
    );
  });

  testWidgets('splash uses the exact ShortiGo brand casing', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: ShortiGoVortexSplash(progress: 1),
      ),
    );

    expect(find.text('ShortiGo'), findsOneWidget);
    expect(find.text('SHORTIGO'), findsNothing);
  });
}
