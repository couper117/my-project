// Notifications center + alert threshold preferences.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/state/app_state.dart';
import '../../core/state/strings.dart';
import '../../core/theme/app_theme.dart';

class AlertsScreen extends ConsumerStatefulWidget {
  const AlertsScreen({super.key});

  @override
  ConsumerState<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends ConsumerState<AlertsScreen> {
  final Set<int> _thresholds = {20, 10, 5, 2};

  IconData _icon(String category) => switch (category) {
        'payment' => Icons.check_circle_outline,
        'balance' => Icons.battery_alert_outlined,
        'outage' => Icons.fmd_bad_outlined,
        'tip' => Icons.lightbulb_outline,
        _ => Icons.campaign_outlined,
      };

  @override
  Widget build(BuildContext context) {
    final notifications = ref.watch(notificationsProvider);
    final t = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: Text(tr(ref, 'alerts'))),
      body: ListView(
        padding: const EdgeInsets.all(Tokens.s5),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Low balance alerts', style: t.titleMedium),
                const SizedBox(height: 6),
                Text('Notify me when balance drops below:', style: t.bodySmall),
                const SizedBox(height: Tokens.s3),
                Wrap(
                  spacing: Tokens.s2,
                  children: [
                    for (final v in const [20, 10, 5, 2])
                      FilterChip(
                        label: Text('$v kWh'),
                        selected: _thresholds.contains(v),
                        onSelected: (sel) => setState(() =>
                            sel ? _thresholds.add(v) : _thresholds.remove(v)),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: Tokens.s4),
          Text('Notifications', style: t.titleMedium),
          const SizedBox(height: Tokens.s2),
          for (var i = 0; i < notifications.length; i++) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: Tokens.s3),
              child: AppCard(
                padding: const EdgeInsets.all(Tokens.s4),
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(_icon(notifications[i].category)),
                  title: Text(
                    notifications[i].title,
                    style: TextStyle(
                        fontWeight: notifications[i].read
                            ? FontWeight.w400
                            : FontWeight.w700),
                  ),
                  subtitle: Text(notifications[i].body),
                  onTap: () =>
                      ref.read(notificationsProvider.notifier).markRead(i),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
