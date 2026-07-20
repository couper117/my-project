// Design system implementation — light & dark Material 3 themes.
// Token values mirror docs/05-UIUX-Design-System.md.
import 'package:flutter/material.dart';

/// Raw design tokens.
abstract final class Tokens {
  static const regGreen = Color(0xFF0B7A3B);
  static const regGreenDark = Color(0xFF4CC38A);
  static const energyAmber = Color(0xFFF5B301);
  static const energyAmberDark = Color(0xFFFFC94D);
  static const infoBlue = Color(0xFF1565C0);

  static const balanceLow = Color(0xFFB45309);
  static const balanceCritical = Color(0xFFBA1A1A);

  static const radiusCard = 20.0;
  static const radiusButton = 14.0;

  static const s1 = 4.0, s2 = 8.0, s3 = 12.0, s4 = 16.0, s5 = 20.0, s6 = 24.0;
}

abstract final class AppTheme {
  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final scheme = ColorScheme.fromSeed(
      seedColor: Tokens.regGreen,
      brightness: brightness,
      primary:
          brightness == Brightness.light ? Tokens.regGreen : Tokens.regGreenDark,
      secondary: brightness == Brightness.light
          ? Tokens.energyAmber
          : Tokens.energyAmberDark,
      surface: brightness == Brightness.light
          ? const Color(0xFFFAFDF9)
          : const Color(0xFF101511),
    );

    final base = ThemeData(useMaterial3: true, colorScheme: scheme);

    return base.copyWith(
      textTheme: base.textTheme.copyWith(
        displayMedium: base.textTheme.displayMedium
            ?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -1),
        headlineSmall:
            base.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
        titleMedium:
            base.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Tokens.radiusButton),
          ),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

/// Rounded card used across the app (replaces global CardTheme for
/// compatibility across Flutter versions).
class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.padding});
  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(Tokens.s5),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(Tokens.radiusCard),
        border: Border.all(color: cs.outlineVariant.withOpacity(0.5)),
      ),
      child: child,
    );
  }
}
