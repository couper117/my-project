// Bottom-navigation shell: Home, Usage, Buy, Alerts, More.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/state/app_state.dart';
import '../../core/state/strings.dart';
import '../alerts/alerts_screen.dart';
import '../analytics/analytics_screen.dart';
import '../dashboard/presentation/dashboard_screen.dart';
import '../more/more_screen.dart';
import '../purchase/presentation/buy_screen.dart';

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final unread = ref.watch(unreadCountProvider);

    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: const [
          DashboardScreen(),
          AnalyticsScreen(),
          BuyScreen(),
          AlertsScreen(),
          MoreScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          NavigationDestination(
              icon: const Icon(Icons.home_outlined),
              selectedIcon: const Icon(Icons.home),
              label: tr(ref, 'home')),
          NavigationDestination(
              icon: const Icon(Icons.bar_chart_outlined),
              selectedIcon: const Icon(Icons.bar_chart),
              label: tr(ref, 'usage')),
          NavigationDestination(
              icon: const Icon(Icons.bolt_outlined),
              selectedIcon: const Icon(Icons.bolt),
              label: tr(ref, 'buy')),
          NavigationDestination(
              icon: Badge(
                  isLabelVisible: unread > 0,
                  label: Text('$unread'),
                  child: const Icon(Icons.notifications_outlined)),
              selectedIcon: const Icon(Icons.notifications),
              label: tr(ref, 'alerts')),
          NavigationDestination(
              icon: const Icon(Icons.menu),
              label: tr(ref, 'more')),
        ],
      ),
    );
  }
}
