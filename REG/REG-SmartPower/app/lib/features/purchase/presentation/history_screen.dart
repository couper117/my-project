// Purchase history with token recall and mock receipt.
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/state/app_state.dart';
import '../../../core/theme/app_theme.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final meter = ref.watch(selectedMeterProvider);
    final purchases = ref
        .watch(purchasesProvider)
        .where((p) => p.meterId == meter.id)
        .toList();

    return Scaffold(
      appBar: AppBar(title: Text('Purchases · ${meter.label}')),
      body: purchases.isEmpty
          ? const Center(child: Text('No purchases yet'))
          : ListView.separated(
              padding: const EdgeInsets.all(Tokens.s5),
              itemCount: purchases.length,
              separatorBuilder: (_, __) => const SizedBox(height: Tokens.s3),
              itemBuilder: (context, i) {
                final p = purchases[i];
                return AppCard(
                  padding: const EdgeInsets.all(Tokens.s4),
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                        child: const Icon(Icons.bolt, size: 20)),
                    title: Text(
                        '${formatNum(p.amountRwf)} RWF · ${p.kwh.toStringAsFixed(1)} kWh'),
                    subtitle: Text(
                        '${p.method} · ${p.date.day}/${p.date.month}/${p.date.year} · ${p.id}'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => showModalBottomSheet<void>(
                      context: context,
                      builder: (_) => _DetailSheet(p: p),
                    ),
                  ),
                );
              },
            ),
    );
  }
}

class _DetailSheet extends StatelessWidget {
  const _DetailSheet({required this.p});
  final Purchase p;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.all(Tokens.s6),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Transaction ${p.id}',
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: Tokens.s4),
          Container(
            padding: const EdgeInsets.all(Tokens.s4),
            decoration: BoxDecoration(
              color: cs.primaryContainer,
              borderRadius: BorderRadius.circular(14),
            ),
            child: SelectableText(
              groupToken(p.token),
              textAlign: TextAlign.center,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 18),
            ),
          ),
          const SizedBox(height: Tokens.s4),
          OutlinedButton.icon(
            icon: const Icon(Icons.copy),
            label: const Text('Copy token'),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: p.token));
              Navigator.of(context).pop();
            },
          ),
          const SizedBox(height: Tokens.s2),
          TextButton.icon(
            icon: const Icon(Icons.picture_as_pdf_outlined),
            label: const Text('Download receipt (demo)'),
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('Receipt download is wired to the backend '
                        'in the production build'))),
          ),
        ],
      ),
    );
  }
}
