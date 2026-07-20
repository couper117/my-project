// Root widget: Material 3, light/dark/system themes.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/theme/app_theme.dart';
import 'features/onboarding/splash_screen.dart';

/// User-selected theme mode (Settings > Theme).
final themeModeProvider = StateProvider<ThemeMode>((_) => ThemeMode.system);

class SmartPowerApp extends ConsumerWidget {
  const SmartPowerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'REG SmartPower',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ref.watch(themeModeProvider),
      home: const SplashScreen(),
    );
  }
}
