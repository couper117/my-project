// Settings & extras: theme, language, meters, support, about.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/state/app_state.dart';
import '../../core/state/strings.dart';
import '../../core/theme/app_theme.dart';
import '../outages/outages_screen.dart';
import '../simulator/simulator_screen.dart';

class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final lang = ref.watch(languageProvider);
    final meters = ref.watch(metersProvider);
    final t = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: Text(tr(ref, 'more'))),
      body: ListView(
        padding: const EdgeInsets.all(Tokens.s5),
        children: [
          Text(tr(ref, 'settings'), style: t.titleMedium),
          const SizedBox(height: Tokens.s3),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr(ref, 'theme'), style: t.bodyMedium),
                const SizedBox(height: Tokens.s2),
                SegmentedButton<ThemeMode>(
                  segments: const [
                    ButtonSegment(
                        value: ThemeMode.light,
                        icon: Icon(Icons.light_mode_outlined),
                        label: Text('Light')),
                    ButtonSegment(
                        value: ThemeMode.dark,
                        icon: Icon(Icons.dark_mode_outlined),
                        label: Text('Dark')),
                    ButtonSegment(
                        value: ThemeMode.system,
                        icon: Icon(Icons.brightness_auto_outlined),
                        label: Text('Auto')),
                  ],
                  selected: {themeMode},
                  onSelectionChanged: (s) =>
                      ref.read(themeModeProvider.notifier).state = s.first,
                ),
                const SizedBox(height: Tokens.s4),
                Text(tr(ref, 'language'), style: t.bodyMedium),
                const SizedBox(height: Tokens.s2),
                DropdownButtonFormField<String>(
                  value: lang,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12)),
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  ),
                  items: [
                    for (final e in languages.entries)
                      DropdownMenuItem(value: e.key, child: Text(e.value)),
                  ],
                  onChanged: (v) {
                    if (v != null) {
                      ref.read(languageProvider.notifier).state = v;
                    }
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: Tokens.s5),
          Text('My meters', style: t.titleMedium),
          const SizedBox(height: Tokens.s3),
          for (final m in meters)
            Padding(
              padding: const EdgeInsets.only(bottom: Tokens.s3),
              child: AppCard(
                padding: const EdgeInsets.all(Tokens.s4),
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.electric_meter_outlined),
                  title: Text('${m.label} · ${m.number}'),
                  subtitle: Text(
                      '${m.district}, ${m.sector} · ${m.kind == MeterKind.ami ? 'Smart (live)' : 'STS keypad (estimated)'}'),
                  trailing: m.id == ref.watch(selectedMeterIdProvider)
                      ? Icon(Icons.check_circle,
                          color: Theme.of(context).colorScheme.primary)
                      : null,
                  onTap: () =>
                      ref.read(selectedMeterIdProvider.notifier).state = m.id,
                ),
              ),
            ),
          OutlinedButton.icon(
            icon: const Icon(Icons.add),
            label: const Text('Add meter'),
            onPressed: () => _addMeterDialog(context, ref),
          ),
          const SizedBox(height: Tokens.s5),
          Text('Services', style: t.titleMedium),
          const SizedBox(height: Tokens.s3),
          AppCard(
            padding: const EdgeInsets.symmetric(
                horizontal: Tokens.s4, vertical: Tokens.s1),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.calculate_outlined),
                  title: const Text('Consumption simulator'),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => const SimulatorScreen())),
                ),
                ListTile(
                  leading: const Icon(Icons.fmd_bad_outlined),
                  title: const Text('Power outages'),
                  onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const OutagesScreen())),
                ),
                ListTile(
                  leading: const Icon(Icons.support_agent),
                  title: const Text('Customer support'),
                  onTap: () => _supportSheet(context),
                ),
                ListTile(
                  leading: const Icon(Icons.group_outlined),
                  title: const Text('Family sharing'),
                  subtitle: const Text('Viewer · Purchaser · Admin roles'),
                  onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text(
                              'Family sharing invites are wired to the backend '
                              'in the production build'))),
                ),
              ],
            ),
          ),
          const SizedBox(height: Tokens.s5),
          Center(
            child: Text('REG SmartPower 1.0.0 · demo build\n© Rwanda Energy Group',
                textAlign: TextAlign.center, style: t.bodySmall),
          ),
        ],
      ),
    );
  }

  void _addMeterDialog(BuildContext context, WidgetRef ref) {
    final number = TextEditingController();
    final label = TextEditingController(text: 'Rental');
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Add meter'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: number,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Meter number'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: label,
              decoration: const InputDecoration(labelText: 'Label'),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Cancel')),
          FilledButton(
            onPressed: () {
              if (number.text.trim().isNotEmpty) {
                ref.read(metersProvider.notifier).add(Meter(
                      id: 'm${DateTime.now().millisecondsSinceEpoch}',
                      number: number.text.trim(),
                      label: label.text.trim().isEmpty
                          ? 'Meter'
                          : label.text.trim(),
                      kind: MeterKind.stsKeypad,
                    ));
              }
              Navigator.of(dialogContext).pop();
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  void _supportSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            ListTile(leading: Icon(Icons.chat_outlined), title: Text('Live chat')),
            ListTile(leading: Icon(Icons.call_outlined), title: Text('Call REG (2727)')),
            ListTile(leading: Icon(Icons.email_outlined), title: Text('Email support')),
            ListTile(
                leading: Icon(Icons.report_problem_outlined),
                title: Text('Report outage or damaged meter')),
          ],
        ),
      ),
    );
  }
}
