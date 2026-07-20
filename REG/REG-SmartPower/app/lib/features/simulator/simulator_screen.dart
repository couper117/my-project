// Consumption simulator: pick appliances + hours, see daily/monthly
// kWh and cost at the selected meter's tariff.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/state/app_state.dart';
import '../../core/theme/app_theme.dart';

class _Appliance {
  _Appliance(this.name, this.watts, this.hours, [this.qty = 1]);
  final String name;
  final int watts;
  double hours;
  int qty;

  double get dailyKwh => watts * qty * hours / 1000;
}

class SimulatorScreen extends ConsumerStatefulWidget {
  const SimulatorScreen({super.key});

  @override
  ConsumerState<SimulatorScreen> createState() => _SimulatorScreenState();
}

class _SimulatorScreenState extends ConsumerState<SimulatorScreen> {
  final _items = [
    _Appliance('Lights', 150, 5),
    _Appliance('TV', 80, 4),
    _Appliance('Fridge', 200, 24),
    _Appliance('Iron', 1000, 0.5),
    _Appliance('Computer', 120, 0),
    _Appliance('Microwave', 900, 0),
    _Appliance('Water heater', 1500, 0),
    _Appliance('AC', 1200, 0),
  ];

  @override
  Widget build(BuildContext context) {
    final meter = ref.watch(selectedMeterProvider);
    final t = Theme.of(context).textTheme;

    final dailyKwh =
        _items.fold<double>(0, (sum, a) => sum + a.dailyKwh);
    final monthlyKwh = dailyKwh * 30;
    final monthlyCost = monthlyKwh * meter.tariffRwfPerKwh;

    return Scaffold(
      appBar: AppBar(title: const Text('Consumption Simulator')),
      body: ListView(
        padding: const EdgeInsets.all(Tokens.s5),
        children: [
          AppCard(
            child: Column(
              children: [
                Text('${dailyKwh.toStringAsFixed(1)} kWh / day',
                    style: t.headlineSmall),
                const SizedBox(height: 4),
                Text(
                    '≈ ${monthlyKwh.toStringAsFixed(0)} kWh · ${formatNum(monthlyCost)} RWF per month',
                    style: t.bodyMedium),
              ],
            ),
          ),
          const SizedBox(height: Tokens.s4),
          for (final a in _items)
            Padding(
              padding: const EdgeInsets.only(bottom: Tokens.s3),
              child: AppCard(
                padding: const EdgeInsets.all(Tokens.s4),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${a.name} · ${a.watts} W',
                              style: t.titleSmall),
                          Text(
                              '${a.hours.toStringAsFixed(1)} h/day → ${a.dailyKwh.toStringAsFixed(2)} kWh',
                              style: t.bodySmall),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline),
                      onPressed: () => setState(() =>
                          a.hours = (a.hours - 0.5).clamp(0, 24).toDouble()),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline),
                      onPressed: () => setState(() =>
                          a.hours = (a.hours + 0.5).clamp(0, 24).toDouble()),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
