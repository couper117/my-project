// In-memory mock state for the demo build. In production these providers
// are backed by the REST API (see backend/ and api/openapi.yaml).
import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';

// ----------------------------- models -----------------------------

enum MeterKind { stsKeypad, ami }

class Meter {
  const Meter({
    required this.id,
    required this.number,
    required this.label,
    required this.kind,
    this.tariffRwfPerKwh = 249,
    this.district = 'Gasabo',
    this.sector = 'Remera',
  });

  final String id;
  final String number;
  final String label;
  final MeterKind kind; // stsKeypad = estimated values, ami = live values
  final double tariffRwfPerKwh;
  final String district;
  final String sector;
}

class Purchase {
  const Purchase({
    required this.id,
    required this.meterId,
    required this.date,
    required this.amountRwf,
    required this.kwh,
    required this.method,
    required this.token,
  });

  final String id;
  final String meterId;
  final DateTime date;
  final double amountRwf;
  final double kwh;
  final String method;
  final String token; // 20-digit STS token
}

class AppNotification {
  const AppNotification({
    required this.title,
    required this.body,
    required this.category,
    required this.time,
    this.read = false,
  });

  final String title;
  final String body;
  final String category; // payment | balance | outage | tip | government
  final DateTime time;
  final bool read;

  AppNotification asRead() => AppNotification(
      title: title, body: body, category: category, time: time, read: true);
}

// ----------------------------- helpers -----------------------------

/// 5926 -> "5,926"
String formatNum(num n) {
  final s = n.round().toString();
  final out = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    out.write(s[i]);
    final remaining = s.length - 1 - i;
    if (remaining > 0 && remaining % 3 == 0) out.write(',');
  }
  return out.toString();
}

String generateToken() {
  final r = Random.secure();
  return List.generate(20, (_) => r.nextInt(10)).join();
}

/// "12345678901234567890" -> "1234 5678 9012 3456 7890"
String groupToken(String t) =>
    t.replaceAllMapped(RegExp('.{4}'), (m) => '${m[0]} ').trim();

// ----------------------------- providers -----------------------------

class MetersNotifier extends StateNotifier<List<Meter>> {
  MetersNotifier()
      : super(const [
          Meter(
              id: 'm1',
              number: '04123456789',
              label: 'Home',
              kind: MeterKind.stsKeypad),
          Meter(
              id: 'm2',
              number: '04987654321',
              label: 'Business',
              kind: MeterKind.ami,
              district: 'Kicukiro',
              sector: 'Niboye'),
        ]);

  void add(Meter m) => state = [...state, m];
}

final metersProvider =
    StateNotifierProvider<MetersNotifier, List<Meter>>((_) => MetersNotifier());

final selectedMeterIdProvider = StateProvider<String>((_) => 'm1');

final selectedMeterProvider = Provider<Meter>((ref) {
  final id = ref.watch(selectedMeterIdProvider);
  final meters = ref.watch(metersProvider);
  return meters.firstWhere((m) => m.id == id, orElse: () => meters.first);
});

/// Remaining kWh per meter. Buying tokens tops this up.
class BalancesNotifier extends StateNotifier<Map<String, double>> {
  BalancesNotifier() : super(const {'m1': 23.8, 'm2': 4.6});

  void addKwh(String meterId, double kwh) =>
      state = {...state, meterId: (state[meterId] ?? 0) + kwh};
}

final balancesProvider =
    StateNotifierProvider<BalancesNotifier, Map<String, double>>(
        (_) => BalancesNotifier());

/// Deterministic mock daily usage (kWh) so charts are stable per meter.
final dailyUsageProvider = Provider.family<List<double>, String>((ref, meterId) {
  final r = Random(meterId.hashCode);
  return List.generate(30, (_) => 3.3 + r.nextDouble() * 2.4);
});

class PurchasesNotifier extends StateNotifier<List<Purchase>> {
  PurchasesNotifier()
      : super([
          Purchase(
              id: 'TX-9F3K2M',
              meterId: 'm1',
              date: DateTime.now().subtract(const Duration(days: 6)),
              amountRwf: 10000,
              kwh: 40.2,
              method: 'MTN MoMo',
              token: '18273645509182736455'),
          Purchase(
              id: 'TX-7Q1D8Z',
              meterId: 'm1',
              date: DateTime.now().subtract(const Duration(days: 19)),
              amountRwf: 5000,
              kwh: 20.1,
              method: 'Airtel Money',
              token: '90817263544501928374'),
          Purchase(
              id: 'TX-2B6N4X',
              meterId: 'm2',
              date: DateTime.now().subtract(const Duration(days: 3)),
              amountRwf: 20000,
              kwh: 80.3,
              method: 'Visa',
              token: '56473829106574839201'),
        ]);

  void add(Purchase p) => state = [p, ...state];
}

final purchasesProvider =
    StateNotifierProvider<PurchasesNotifier, List<Purchase>>(
        (_) => PurchasesNotifier());

class NotificationsNotifier extends StateNotifier<List<AppNotification>> {
  NotificationsNotifier()
      : super([
          AppNotification(
              title: 'Low balance',
              body:
                  'Business meter is at 4.6 kWh — estimated to run out within a day.',
              category: 'balance',
              time: DateTime.now().subtract(const Duration(hours: 2))),
          AppNotification(
              title: 'Scheduled maintenance',
              body:
                  'Substation maintenance in Remera sector, Thursday 09:00–15:00.',
              category: 'outage',
              time: DateTime.now().subtract(const Duration(days: 1))),
          AppNotification(
              title: 'Energy tip',
              body:
                  'Switching off standby devices could save about 8% monthly.',
              category: 'tip',
              time: DateTime.now().subtract(const Duration(days: 2)),
              read: true),
        ]);

  void add(AppNotification n) => state = [n, ...state];

  void markRead(int index) => state = [
        for (var i = 0; i < state.length; i++)
          i == index ? state[i].asRead() : state[i]
      ];
}

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, List<AppNotification>>(
        (_) => NotificationsNotifier());

final unreadCountProvider = Provider<int>(
    (ref) => ref.watch(notificationsProvider).where((n) => !n.read).length);

// ----------------------------- actions -----------------------------

/// Mock purchase: simulates the payment + vending round-trip, then updates
/// balance, history and notifications. Mirrors the production state machine
/// pending -> paid -> vending -> completed (see backend/purchases.service.ts).
Future<Purchase> buyElectricity(
  WidgetRef ref, {
  required Meter meter,
  required double amountRwf,
  required String method,
}) async {
  await Future<void>.delayed(const Duration(seconds: 2)); // payment + vending
  final purchase = Purchase(
    id: 'TX-${DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase()}',
    meterId: meter.id,
    date: DateTime.now(),
    amountRwf: amountRwf,
    kwh: amountRwf / meter.tariffRwfPerKwh,
    method: method,
    token: generateToken(),
  );
  ref.read(purchasesProvider.notifier).add(purchase);
  ref.read(balancesProvider.notifier).addKwh(meter.id, purchase.kwh);
  ref.read(notificationsProvider.notifier).add(AppNotification(
        title: 'Payment confirmed',
        body:
            '${formatNum(amountRwf)} RWF → ${purchase.kwh.toStringAsFixed(1)} kWh added to ${meter.label}.',
        category: 'payment',
        time: DateTime.now(),
      ));
  return purchase;
}
