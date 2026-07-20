// Power outages list (production build shows these on a Google Map —
// see docs/05 §8; the demo uses a list to avoid requiring an API key).
import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';

class OutagesScreen extends StatelessWidget {
  const OutagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Power Outages')),
      body: ListView(
        padding: const EdgeInsets.all(Tokens.s5),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.circle, size: 12, color: Tokens.balanceCritical),
                    const SizedBox(width: 8),
                    Text('Active outage', style: t.titleMedium),
                  ],
                ),
                const SizedBox(height: 8),
                Text('Nyarugenge — Muhima feeder fault', style: t.bodyLarge),
                Text('Affected: Muhima, Nyabugogo · since 14:20',
                    style: t.bodySmall),
                const SizedBox(height: 8),
                Text('Estimated restoration: today 19:00',
                    style: t.bodyMedium?.copyWith(
                        color: cs.primary, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          const SizedBox(height: Tokens.s3),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.circle, size: 12, color: Tokens.energyAmber),
                    const SizedBox(width: 8),
                    Text('Scheduled maintenance', style: t.titleMedium),
                  ],
                ),
                const SizedBox(height: 8),
                Text('Gasabo — Remera substation', style: t.bodyLarge),
                Text('Thursday 09:00–15:00 · Remera, Nyabisindu',
                    style: t.bodySmall),
                const SizedBox(height: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Tokens.energyAmber.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text('⚠ Affects your Home meter',
                      style: TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
          const SizedBox(height: Tokens.s4),
          Center(
              child: Text(
                  'Interactive map with outage polygons ships in the\n'
                  'production build (Google Maps + GeoJSON from /outages).',
                  textAlign: TextAlign.center,
                  style: t.bodySmall)),
        ],
      ),
    );
  }
}
