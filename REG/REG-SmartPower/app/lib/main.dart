// REG SmartPower — demo entry point (mock data, no backend required).
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';

void main() {
  runApp(const ProviderScope(child: SmartPowerApp()));
}
