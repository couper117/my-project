// Dashboard: meter switcher, balance hero (estimated vs live),
// quick actions, 7-day usage chart, energy tip.
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/state/app_state.dart';
import '../../../core/state/strings.dart';
import '../../../core/theme/app_theme.dart';
import '../../outages/outages_screen.dart';
import '../../purchase/presentation/buy_screen.dart';
import '../../purchase/presentation/history_screen.dart';
import '../../simulator/simulator_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final meter = ref.watch(selectedMeterProvider);
    final meters = ref.watch(metersProvider);
    final balanceKwh = ref.watch(balancesProvider)[meter.id] ?? 0;
    final usage = ref.watch(dailyUsageProvider(meter.id));

    final week = usage.sublist(usage.length - 7);
    final avgDaily = usage.reduce((a, b) => a + b) / usage.length;
    final daysLeft = avgDaily > 0 ? balanceKwh / avgDaily : 0.0;
    final isLive = meter.kind == MeterKind.ami;

    return Scaffold(
      appBar: AppBar(
        title: PopupMenuButton<String>(
          onSelected: (id) =>
              ref.read(selectedMeterIdProvider.notifier).state = id,
          itemBuilder: (_) => [
            for (final m in meters)
              PopupMenuItem(value: m.id, child: Text('${m.label} · ${m.number}')),
          ],
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.electric_meter_outlined, size: 20),
              const SizedBox(width: 6),
              Text('${meter.label} · ${meter.number}',
                  style: const TextStyle(fontSize: 15)),
              const Icon(Icons.arrow_drop_down),
            ],
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(Tokens.s5),
        children: [
          _BalanceCard(
              ref: ref,
              kwh: balanceKwh,
              rwf: balanceKwh * meter.tariffRwfPerKwh,
              daysLeft: daysLeft,
              isLive: isLive),
          const SizedBox(height: Tokens.s4),
          _QuickActions(meter: meter),
          const SizedBox(height: Tokens.s4),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(tr(ref, 'last7'),
                        style: Theme.of(context).textTheme.titleMedium),
                    const Spacer(),
                    Text(
                        '${week.reduce((a, b) => a + b).toStringAsFixed(1)} kWh',
                        style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
                const SizedBox(height: Tokens.s4),
                SizedBox(height: 120, child: _WeekChart(week: week)),
              ],
            ),
          ),
          const SizedBox(height: Tokens.s4),
          if (isLive) ...[
            _LiveCard(),
            const SizedBox(height: Tokens.s4),
          ],
          AppCard(
            child: Row(
              children: [
                const Text('💡', style: TextStyle(fontSize: 22)),
                const SizedBox(width: Tokens.s3),
                Expanded(
                    child: Text(tr(ref, 'tip'),
                        style: Theme.of(context).textTheme.bodyMedium)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  const _BalanceCard(
      {required this.ref,
      required this.kwh,
      required this.rwf,
      required this.daysLeft,
      required this.isLive});

  final WidgetRef ref;
  final double kwh;
  final double rwf;
  final double daysLeft;
  final bool isLive;

  Color _color(BuildContext context) {
    if (kwh <= 5) return Tokens.balanceCritical;
    if (kwh <= 10) return Tokens.balanceLow;
    return Theme.of(context).colorScheme.primary;
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(tr(ref, 'balance'), style: t.titleMedium),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isLive
                      ? cs.primaryContainer
                      : Tokens.energyAmber.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Text(
                  isLive ? '● ${tr(ref, 'live')}' : '◔ ${tr(ref, 'estimated')}',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isLive ? cs.primary : Tokens.balanceLow),
                ),
              ),
            ],
          ),
          const SizedBox(height: Tokens.s2),
          Text('${kwh.toStringAsFixed(1)} kWh',
              style: t.displayMedium?.copyWith(color: _color(context))),
          Text(
              '≈ ${formatNum(rwf)} RWF · ${daysLeft.toStringAsFixed(0)} ${tr(ref, 'daysLeft')}',
              style: t.bodyLarge),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({required this.meter});
  final Meter meter;

  @override
  Widget build(BuildContext context) {
    final actions = <(IconData, String, VoidCallback)>[
      (
        Icons.flash_on,
        'Buy',
        () => Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => const BuyScreen(standalone: true)))
      ),
      (
        Icons.receipt_long,
        'Tokens',
        () => Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => const HistoryScreen()))
      ),
      (
        Icons.fmd_bad_outlined,
        'Outages',
        () => Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => const OutagesScreen()))
      ),
      (
        Icons.calculate_outlined,
        'Simulate',
        () => Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => const SimulatorScreen()))
      ),
    ];

    return Row(
      children: [
        for (final (icon, label, onTap) in actions)
          Expanded(
            child: Column(
              children: [
                FilledButton.tonal(
                  onPressed: onTap,
                  style: FilledButton.styleFrom(
                      minimumSize: const Size(56, 56),
                      shape: const CircleBorder()),
                  child: Icon(icon),
                ),
                const SizedBox(height: Tokens.s1),
                Text(label, style: Theme.of(context).textTheme.labelMedium),
              ],
            ),
          ),
      ],
    );
  }
}

class _WeekChart extends StatelessWidget {
  const _WeekChart({required this.week});
  final List<double> week;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return BarChart(
      BarChartData(
        borderData: FlBorderData(show: false),
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        barTouchData: BarTouchData(enabled: false),
        barGroups: [
          for (var i = 0; i < week.length; i++)
            BarChartGroupData(x: i, barRods: [
              BarChartRodData(
                toY: week[i],
                width: 18,
                borderRadius: BorderRadius.circular(6),
                color: i == week.length - 1 ? cs.primary : cs.primaryContainer,
              ),
            ]),
        ],
      ),
    );
  }
}

/// Live telemetry card — only shown for AMI meters (Tier B).
class _LiveCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    Widget row(String k, String v) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(
            children: [
              Text(k, style: t.bodyMedium),
              const Spacer(),
              Text(v, style: t.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
            ],
          ),
        );

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Right now', style: t.titleMedium),
          const SizedBox(height: 6),
          row('Power draw', '1.43 kW'),
          row('Voltage', '228 V'),
          row('Current', '6.2 A'),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              children: [
                Text('Meter status', style: t.bodyMedium),
                const Spacer(),
                Text('● Online',
                    style: t.bodyMedium?.copyWith(
                        color: cs.primary, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
