import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

/// Vortex play-button splash — mirrors `tools/splash-infinite-stream/index.html`.
class ShortiGoVortexSplash extends StatelessWidget {
  const ShortiGoVortexSplash({
    super.key,
    required this.progress,
  });

  /// Normalized timeline progress in `[0, 1]` (~1.2 seconds).
  final double progress;

  static const Color background = Color(0xFF090412);

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final centerY = size.height * 0.42;

    final titleProgress = _flingProgress(progress, start: 0.28, end: 0.52);
    final taglineProgress = _flingProgress(progress, start: 0.36, end: 0.58);

    return Stack(
      fit: StackFit.expand,
      children: [
        CustomPaint(
          painter: _VortexSplashPainter(progress: progress),
        ),
        Positioned(
          left: 0,
          right: 0,
          top: centerY + size.width * 0.34,
          child: Transform.translate(
            offset: Offset(0, ui.lerpDouble(72, 0, titleProgress)!),
            child: Opacity(
              opacity: titleProgress.clamp(0.0, 1.0),
              child: Text(
                'ShortiGo',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: size.width * 0.078,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0,
                  color: const Color(0xFFF3EEFF),
                  shadows: const [
                    Shadow(
                      color: Color(0x668B5CF6),
                      blurRadius: 24,
                    ),
                    Shadow(
                      color: Color(0x44E879F9),
                      blurRadius: 48,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        Positioned(
          left: 24,
          right: 24,
          top: centerY + size.width * 0.34 + size.width * 0.12,
          child: Transform.translate(
            offset: Offset(0, ui.lerpDouble(48, 0, taglineProgress)!),
            child: Opacity(
              opacity: taglineProgress.clamp(0.0, 1.0),
              child: Text(
                'SHORT VIDEOS. INFINITE DISCOVERY.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: size.width * 0.028,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 1.6,
                  color: const Color(0xFFBFA8E8),
                  shadows: const [
                    Shadow(
                      color: Color(0x558B5CF6),
                      blurRadius: 16,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  static double _flingProgress(double t, {required double start, required double end}) {
    if (t <= start) {
      return 0;
    }
    if (t >= end) {
      return 1;
    }
    final local = (t - start) / (end - start);
    return Curves.easeOutBack.transform(local.clamp(0.0, 1.0));
  }
}

class _VortexSplashPainter extends CustomPainter {
  _VortexSplashPainter({required this.progress});

  final double progress;

  static const _bg = Color(0xFF090412);
  static const _violet = Color(0xFF8B5CF6);
  static const _magenta = Color(0xFFE879F9);
  static const _orange = Color(0xFFFFB347);
  static const _gold = Color(0xFFFFD166);

  @override
  void paint(Canvas canvas, Size size) {
    final t = progress.clamp(0.0, 1.0);
    final center = Offset(size.width * 0.5, size.height * 0.42);
    final ringRadius = size.width * 0.34;

    canvas.drawRect(Offset.zero & size, Paint()..color = _bg);
    _paintAmbientParticles(canvas, size, t);
    _paintBottomStreaks(canvas, size, t);

    final intro = Curves.easeOutCubic.transform((t / 0.25).clamp(0.0, 1.0));
    final spin = t * math.pi * 7.5;

    canvas.save();
    canvas.translate(center.dx, center.dy);

    _paintRingGlow(canvas, ringRadius, intro, t);
    _paintSpinningRing(canvas, ringRadius, spin, intro);
    _paintPlayGlow(canvas, ringRadius * 0.34, t, intro);
    _paintPlayIcon(canvas, ringRadius * 0.34, t, intro);

    canvas.restore();
  }

  void _paintAmbientParticles(Canvas canvas, Size size, double t) {
    for (var i = 0; i < 22; i++) {
      final seed = (i * 4177 + 13) % 9973 / 9973.0;
      final x = seed * size.width;
      final y = (seed * 1.73 % 1) * size.height;
      final pulse = 0.35 + 0.65 * math.sin(t * math.pi * 4 + seed * 12);
      final radius = 1.5 + seed * 2.5;
      final color = i.isEven ? _magenta : _violet;
      canvas.drawCircle(
        Offset(x, y),
        radius,
        Paint()..color = color.withValues(alpha: 0.12 * pulse),
      );
    }
  }

  void _paintBottomStreaks(Canvas canvas, Size size, double t) {
    for (var i = 0; i < 5; i++) {
      final seed = (i * 2711 + 7) % 8191 / 8191.0;
      final y = size.height * (0.88 + seed * 0.08);
      final drift = math.sin(t * math.pi * 3 + seed * 8) * 18;
      final paint = Paint()
        ..shader = LinearGradient(
          colors: [
            _violet.withValues(alpha: 0),
            _magenta.withValues(alpha: 0.35),
            _violet.withValues(alpha: 0),
          ],
        ).createShader(Rect.fromLTWH(-40 + drift, y, size.width + 80, 3));
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(-20 + drift + i * 18, y, size.width * 0.55, 2.5),
          const Radius.circular(999),
        ),
        paint,
      );
    }
  }

  void _paintRingGlow(Canvas canvas, double radius, double intro, double t) {
    final pulse = 0.75 + 0.25 * math.sin(t * math.pi * 5);
    final glowPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          _magenta.withValues(alpha: 0.28 * intro * pulse),
          _violet.withValues(alpha: 0.12 * intro * pulse),
          const Color(0x00000000),
        ],
        stops: const [0.35, 0.62, 1],
      ).createShader(Rect.fromCircle(center: Offset.zero, radius: radius * 1.15));
    canvas.drawCircle(Offset.zero, radius * 1.12, glowPaint);
  }

  void _paintSpinningRing(Canvas canvas, double radius, double spin, double intro) {
    const segments = 10;
    for (var i = 0; i < segments; i++) {
      final segmentAngle = (i / segments) * math.pi * 2;
      final arcStart = spin + segmentAngle;
      final sweep = 0.42 + (i % 3) * 0.08;
      final ringWidth = 3.5 + (i % 4) * 1.2;
      final dist = radius * (0.82 + (i % 5) * 0.035);

      final colorT = (math.sin(segmentAngle * 2 + spin * 0.4) + 1) / 2;
      final color = Color.lerp(_violet, _magenta, colorT)!;
      final highlight = i == 2 || i == 3;

      final paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = ringWidth
        ..strokeCap = StrokeCap.round
        ..color = (highlight ? _orange : color).withValues(alpha: 0.85 * intro)
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, highlight ? 6 : 3);

      canvas.drawArc(
        Rect.fromCircle(center: Offset.zero, radius: dist),
        arcStart,
        sweep,
        false,
        paint,
      );
    }

    for (var i = 0; i < 6; i++) {
      final angle = spin * 1.2 + i * 1.05;
      final dist = radius * 0.95;
      final x = math.cos(angle) * dist;
      final y = math.sin(angle) * dist;
      canvas.drawCircle(
        Offset(x, y),
        2.2,
        Paint()..color = (i.isEven ? _gold : _magenta).withValues(alpha: 0.7 * intro),
      );
    }
  }

  void _paintPlayGlow(Canvas canvas, double size, double t, double intro) {
    final pulse = 0.82 + 0.18 * math.sin(t * math.pi * 6);
    final glow = Paint()
      ..maskFilter = MaskFilter.blur(BlurStyle.normal, 22 * pulse)
      ..shader = RadialGradient(
        colors: [
          _orange.withValues(alpha: 0.55 * intro * pulse),
          _magenta.withValues(alpha: 0.35 * intro * pulse),
          const Color(0x00000000),
        ],
      ).createShader(Rect.fromCircle(center: Offset.zero, radius: size * 1.35));
    canvas.drawCircle(Offset.zero, size * 1.1, glow);
  }

  void _paintPlayIcon(Canvas canvas, double size, double t, double intro) {
    final scale = ui.lerpDouble(0.88, 1.0, intro)!;
    canvas.save();
    canvas.scale(scale);

    final playPath = _roundedPlayPath(size);
    final bounds = playPath.getBounds();

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          _gold.withValues(alpha: intro),
          _orange.withValues(alpha: intro),
          _magenta.withValues(alpha: intro),
          _violet.withValues(alpha: intro),
        ],
        stops: const [0, 0.28, 0.62, 1],
      ).createShader(bounds);
    canvas.drawPath(playPath, fillPaint);

    canvas.save();
    canvas.clipPath(playPath);
    _paintWaveLines(canvas, bounds, t, intro);
    canvas.restore();

    final borderPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = Colors.white.withValues(alpha: 0.18 * intro);
    canvas.drawPath(playPath, borderPaint);

    canvas.restore();
  }

  Path _roundedPlayPath(double size) {
    final w = size * 1.05;
    final h = size * 1.18;
    final r = size * 0.22;
    final path = Path();
    path.moveTo(-w * 0.42 + r, -h * 0.5);
    path.lineTo(w * 0.18, -h * 0.5 + r);
    path.quadraticBezierTo(w * 0.52, -h * 0.12, w * 0.52, 0);
    path.quadraticBezierTo(w * 0.52, h * 0.12, w * 0.18, h * 0.5 - r);
    path.lineTo(-w * 0.42 + r, h * 0.5);
    path.quadraticBezierTo(-w * 0.58, 0, -w * 0.42 + r, -h * 0.5);
    path.close();
    return path;
  }

  void _paintWaveLines(Canvas canvas, Rect bounds, double t, double intro) {
    final wavePhase = t * math.pi * 10;
    for (var line = 0; line < 5; line++) {
      final baseY = bounds.top + bounds.height * (0.22 + line * 0.14);
      final path = Path();
      const steps = 24;
      for (var i = 0; i <= steps; i++) {
        final xT = i / steps;
        final x = ui.lerpDouble(bounds.left, bounds.right, xT)!;
        final wave = math.sin(xT * math.pi * 3 + wavePhase + line * 0.9) * 5;
        final y = baseY + wave + math.sin(wavePhase * 0.6 + line) * 2;
        if (i == 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }
      canvas.drawPath(
        path,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.4
          ..color = Colors.white.withValues(alpha: (0.08 + line * 0.025) * intro),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _VortexSplashPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
