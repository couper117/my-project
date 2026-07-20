// Usage analytics: period selector, consumption chart, stats,
// efficiency score, appliance estimate.
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/state/app_state.dart';
import '../../core/state/strings.dart';
import '../../core/theme/app_theme.dart';

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  int _period = 1; // 0=day(hourly) 1=week 2=month

  @override
  Widget build(BuildContext context) {
    final meter = ref.watch(selectedMeterProvider);
    final usage = ref.watch(dailyUsageProvider(meter.id));
    final t = Theme.of(context).textTheme;

    final series = switch (_period) {
      0 => List.generate(24, (h) => usage.last / 24 * (h >= 18 && h <= 22 ? 3 : 1)),
      1 => usage.sublist(usage.length - 7),
      _ => usage,
    };
    final total = series.reduce((a, b) => a + b);
    final maxIdx = series.indexOf(series.reduce((a, b) => a > b ? a : b));
    final minIdx = series.indexOf(series.reduce((a, b) => a < b ? a : b));

    return Scaffold(
      appBar: AppBar(title: Text('${tr(ref, 'usage')} · ${meter.label}')),
      body: ListView(
        padding: const EdgeInsets.all(Tokens.s5),
        children: [
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 0, label: Text('Day')),
              ButtonSegment(value: 1, label: Text('Week')),
              ButtonSegment(value: 2, label: Text('Month')),
            ],
            selected: {_period},
            onSelectionChanged: (s) => setState(() => _period = s.first),
          ),
          const SizedBox(height: Tokens.s4),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('Consumption', style: t.titleMedium),
                    const Spacer(),
                    Text(
                        '${total.toStringAsFixed(1)} kWh · ${formatNum(total * meter.tariffRwfPerKwh)} RWF',
                        style: t.bodySmall),
                  ],
                ),
                const SizedBox(height: Tokens.s4),
                SizedBox(height: 160, child: _LineChart(series: series)),
              ],
            ),
          ),
          const SizedBox(height: Tokens.s4),
          AppCard(
            child: Row(
              children: [
                SizedBox(
                  width: 72,
                  height: 72,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      const CircularProgressIndicator(value: 0.78, strokeWidth: 8),
                      Center(
                          child: Text('78',
                              style: t.titleLarge
                                  ?.copyWith(fontWeight: FontWeight.w700))),
                    ],
                  ),
                ),
                const SizedBox(width: Tokens.s4),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Efficiency score', style: t.titleMedium),
                      Text('Better than 64% of similar homes in ${meter.district}',
                          style: t.bodySmall),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Tokens.s4),
          AppCard(
            child: Column(
              children: [
                _kv(context, 'Peak hours', '6 PM – 10 PM'),
                _kv(context, 'Highest ${_period == 0 ? 'hour' : 'day'}',
                    '#${maxIdx + 1} · ${series[maxIdx].toStringAsFixed(1)} kWh'),
                _kv(context, 'Lowest ${_period == 0 ? 'hour' : 'day'}',
                    '#${minIdx + 1} · ${series[minIdx].toStringAsFixed(1)} kWh'),
                _kv(context, 'Avg. monthly cost',
                    '${formatNum(usage.reduce((a, b) => a + b) * meter.tariffRwfPerKwh)} RWF'),
              ],
            ),
          ),
          const SizedBox(height: Tokens.s4),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Estimated appliances', style: t.titleMedium),
                const SizedBox(height: 6),
                _kv(context, 'Iron', '1000 W'),
                _kv(context, 'Fridge', '200 W'),
                _kv(context, 'Lights', '150 W'),
                _kv(context, 'TV', '80 W'),
                const SizedBox(height: 4),
                Text('Estimated from total consumption patterns',
                    style: t.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _kv(BuildContext context, String k, String v) {
    final t = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Text(k, style: t.bodyMedium),
          const Spacer(),
          Text(v, style: t.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _LineChart extends StatelessWidget {
  const _LineChart({required this.series});
  final List<double> series;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return LineChart(
      LineChartData(
        borderData: FlBorderData(show: false),
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        lineTouchData: LineTouchData(enabled: false),
        lineBarsData: [
          LineChartBarData(
            spots: [
              for (var i = 0; i < series.length; i++)
                FlSpot(i.toDouble(), series[i]),
            ],
            isCurved: true,
            barWidth: 3,
            color: cs.primary,
            dotData: const FlDotData(show: false),
            belowBarData:
                BarAreaData(show: true, color: cs.primary.withOpacity(0.12)),
          ),
        ],
      ),
    );
  }
}
