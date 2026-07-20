// Buy Electricity: amount chips with live kWh conversion, payment method,
// simulated payment + vending, token result sheet.
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/state/app_state.dart';
import '../../../core/state/strings.dart';
import '../../../core/theme/app_theme.dart';

class BuyScreen extends ConsumerStatefulWidget {
  const BuyScreen({super.key, this.standalone = false});

  /// true when pushed as its own route (shows back button).
  final bool standalone;

  @override
  ConsumerState<BuyScreen> createState() => _BuyScreenState();
}

class _BuyScreenState extends ConsumerState<BuyScreen> {
  static const _presets = [2000.0, 5000.0, 10000.0, 20000.0];
  double _amount = 10000;
  String _method = 'MTN MoMo';
  bool _busy = false;

  Future<void> _purchase() async {
    final meter = ref.read(selectedMeterProvider);
    setState(() => _busy = true);

    // Progress dialog while "payment + vending" completes.
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        content: Row(
          children: [
            const CircularProgressIndicator(),
            const SizedBox(width: 20),
            Expanded(
                child: Text(_method.contains('MoMo') || _method.contains('Airtel')
                    ? 'Approve the payment on your phone…'
                    : 'Processing payment…')),
          ],
        ),
      ),
    );

    final purchase = await buyElectricity(ref,
        meter: meter, amountRwf: _amount, method: _method);

    if (!mounted) return;
    Navigator.of(context).pop(); // close progress dialog
    setState(() => _busy = false);

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => _TokenSheet(purchase: purchase, meterLabel: meter.label),
    );
  }

  @override
  Widget build(BuildContext context) {
    final meter = ref.watch(selectedMeterProvider);
    final t = Theme.of(context).textTheme;
    final kwhPreview = _amount / meter.tariffRwfPerKwh;

    return Scaffold(
      appBar: AppBar(
        title: Text(tr(ref, 'buyElectricity')),
        automaticallyImplyLeading: widget.standalone,
      ),
      body: ListView(
        padding: const EdgeInsets.all(Tokens.s5),
        children: [
          Text('Amount', style: t.titleMedium),
          const SizedBox(height: Tokens.s3),
          Wrap(
            spacing: Tokens.s2,
            children: [
              for (final p in _presets)
                ChoiceChip(
                  label: Text('${formatNum(p)} RWF'),
                  selected: _amount == p,
                  onSelected: (_) => setState(() => _amount = p),
                ),
            ],
          ),
          const SizedBox(height: Tokens.s4),
          AppCard(
            padding: const EdgeInsets.all(Tokens.s4),
            child: Row(
              children: [
                Icon(Icons.bolt, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: Tokens.s3),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('≈ ${kwhPreview.toStringAsFixed(1)} kWh',
                        style: t.titleMedium),
                    Text(
                        'at ${formatNum(meter.tariffRwfPerKwh)} RWF/kWh · ${meter.label}',
                        style: t.bodySmall),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: Tokens.s5),
          Text(tr(ref, 'payWith'), style: t.titleMedium),
          const SizedBox(height: Tokens.s2),
          for (final (label, icon) in const [
            ('MTN MoMo', Icons.phone_android),
            ('Airtel Money', Icons.phone_iphone),
            ('Visa / Mastercard', Icons.credit_card),
            ('QR payment', Icons.qr_code_scanner),
          ])
            RadioListTile<String>(
              value: label,
              groupValue: _method,
              onChanged: (v) => setState(() => _method = v!),
              title: Text(label),
              secondary: Icon(icon),
            ),
          const SizedBox(height: Tokens.s5),
          FilledButton(
            onPressed: _busy ? null : _purchase,
            child: Text('Pay ${formatNum(_amount)} RWF'),
          ),
          const SizedBox(height: Tokens.s3),
          const Center(
              child: Text('🔒 Secured by REG · demo payment is simulated',
                  style: TextStyle(fontSize: 12, color: Colors.grey))),
        ],
      ),
    );
  }
}

class _TokenSheet extends StatelessWidget {
  const _TokenSheet({required this.purchase, required this.meterLabel});
  final Purchase purchase;
  final String meterLabel;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final t = Theme.of(context).textTheme;
    return Padding(
      padding: EdgeInsets.only(
          left: Tokens.s6,
          right: Tokens.s6,
          top: Tokens.s6,
          bottom: Tokens.s6 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle, size: 56, color: cs.primary),
          const SizedBox(height: Tokens.s3),
          Text('Token ready', style: t.headlineSmall),
          Text(
              '${formatNum(purchase.amountRwf)} RWF · ${purchase.kwh.toStringAsFixed(1)} kWh · $meterLabel',
              style: t.bodyMedium),
          const SizedBox(height: Tokens.s4),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(Tokens.s4),
            decoration: BoxDecoration(
              color: cs.primaryContainer,
              borderRadius: BorderRadius.circular(14),
            ),
            child: SelectableText(
              groupToken(purchase.token),
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontFamily: 'monospace', fontSize: 20, letterSpacing: 1.5),
            ),
          ),
          const SizedBox(height: Tokens.s2),
          const Text('Enter this token on your meter keypad.',
              style: TextStyle(fontSize: 13)),
          const SizedBox(height: Tokens.s5),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.copy),
                  label: const Text('Copy'),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: purchase.token));
                    ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Token copied')));
                  },
                ),
              ),
              const SizedBox(width: Tokens.s3),
              Expanded(
                child: FilledButton.icon(
                  icon: const Icon(Icons.done),
                  label: const Text('Done'),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
